import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLinkApiError, AniLinkErrorCodes, AniLinkRestError } from "../src/base/AniLinkError";
import { snapshotTransportState } from "../src/base/transportState";
import { ResponseCache } from "../src/base/responseCache";
import { recordPaceDeadline } from "../src/base/pacing";
import { getCircuitState } from "../src/base/circuitBreaker";
import { getRetryBudgetState } from "../src/base/retry";
import { AniLink } from "../src/AniLink";
import { buildProviderClients } from "../src/providers/registry";
import { getAxiosStub, makeAxiosResponseError as apiError } from "./helpers/axiosStub";

/**
 * Transport-state snapshot suite (R-029).
 *
 * Drives the real composition — {@link AniLink} → provider wiring →
 * `sendRequest` → the shared Axios instance — with only axios doubled, then
 * asserts the `getTransportState` snapshot reflects the driven breaker,
 * budget, and pacing state, is deep-frozen, and never mutates the state it
 * observes.
 */

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build();
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.request.mockImplementation(async () => ({ data: { data: { Media: { id: 1 } } } }));
});

describe("snapshotTransportState", () => {
    test("returns empty state for an owner with no recorded traffic", () => {
        const snapshot = snapshotTransportState({});

        expect(snapshot.circuit).toEqual([]);
        expect(snapshot.paceDeadlines).toEqual([]);
        expect(snapshot).not.toHaveProperty("retryBudget");
    });

    test("reflects breaker, budget, and pacing state recorded through the live helpers", () => {
        const owner = {};

        // Drive the live state exactly as the transport would: a breaker
        // entry for one host, a spent budget window, and a pacing deadline.
        const circuit = getCircuitState(owner, "graphql.anilist.co");
        circuit.consecutiveFailures = 3;
        circuit.openedAt = Date.now();
        const budget = getRetryBudgetState(owner, {
            maxRetriesPerWindow: 5,
            windowMs: 60_000,
        });
        if (budget === undefined) {
            throw new Error("budget state must exist once configured");
        }
        budget.retriesUsed = 2;
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5_000);

        const snapshot = snapshotTransportState(owner);

        expect(snapshot.circuit).toEqual([
            {
                host: "graphql.anilist.co",
                consecutiveFailures: 3,
                openedAt: circuit.openedAt,
                probeInFlight: false,
                failedProbes: 0,
            },
        ]);
        expect(snapshot.retryBudget).toEqual({ retriesUsed: 2, windowEndsAt: budget.windowEndsAt });
        expect(snapshot.paceDeadlines).toEqual([
            { host: "graphql.anilist.co", deadlineMs: Date.now() + 5_000 },
        ]);
    });

    test("is deep-frozen: mutating any level throws in strict mode", () => {
        const owner = {};
        const circuit = getCircuitState(owner, "graphql.anilist.co");
        circuit.consecutiveFailures = 1;
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5_000);

        const snapshot = snapshotTransportState(owner);

        expect(Object.isFrozen(snapshot)).toBe(true);
        expect(Object.isFrozen(snapshot.circuit)).toBe(true);
        expect(Object.isFrozen(snapshot.circuit[0])).toBe(true);
        expect(Object.isFrozen(snapshot.paceDeadlines)).toBe(true);
        expect(Object.isFrozen(snapshot.paceDeadlines[0])).toBe(true);
        expect(() => {
            "use strict";
            snapshot.circuit[0].consecutiveFailures = 99;
        }).toThrow();
    });

    test("does not alias the live mutable state", () => {
        const owner = {};
        const circuit = getCircuitState(owner, "graphql.anilist.co");

        const snapshot = snapshotTransportState(owner);
        circuit.consecutiveFailures = 7;

        expect(snapshot.circuit[0].consecutiveFailures).toBe(0);
    });

    test("does not create a circuit entry for an unseen host or owner", () => {
        const owner = {};
        const before = snapshotTransportState(owner);
        expect(before.circuit).toEqual([]);

        // Snapshotting again must not have fabricated state.
        const after = snapshotTransportState(owner);
        expect(after.circuit).toEqual([]);
        expect(after).not.toHaveProperty("retryBudget");
        expect(after.paceDeadlines).toEqual([]);
    });

    test("does not roll an elapsed retry-budget window forward", () => {
        const owner = {};
        const budget = getRetryBudgetState(owner, {
            maxRetriesPerWindow: 5,
            windowMs: 1_000,
        });
        if (budget === undefined) {
            throw new Error("budget state must exist once configured");
        }
        budget.retriesUsed = 4;

        // The window elapses; the snapshot must report the spent state
        // as-is instead of resetting it (which getRetryBudgetState would).
        vi.advanceTimersByTime(1_500);
        const snapshot = snapshotTransportState(owner);
        expect(snapshot.retryBudget).toEqual({ retriesUsed: 4, windowEndsAt: budget.windowEndsAt });

        // And the live state is untouched: the next live read still sees
        // the pre-snapshot values before its own roll.
        expect(budget.retriesUsed).toBe(4);
    });

    test("does not clear a stale pacing deadline", () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 1_000);

        // The deadline elapses; the snapshot reports it as recorded
        // instead of clearing it (which awaitPaceDeadline would).
        vi.advanceTimersByTime(1_500);
        const snapshot = snapshotTransportState(owner);
        expect(snapshot.paceDeadlines).toEqual([
            { host: "graphql.anilist.co", deadlineMs: Date.now() - 500 },
        ]);
    });

    test("includes the response cache counters when a cache is threaded through", () => {
        const owner = {};
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/api", undefined, undefined, { id: 1 });
        cache.get("GET", "https://example.com/api");
        cache.get("GET", "https://example.com/other");

        const snapshot = snapshotTransportState(owner, cache);

        expect(snapshot.responseCache).toEqual({
            entries: 1,
            hits: 1,
            misses: 1,
            expirations: 0,
            evictions: 0,
        });
        expect(Object.isFrozen(snapshot.responseCache)).toBe(true);
    });

    test("omits the responseCache field when no cache is threaded through", () => {
        const snapshot = snapshotTransportState({});
        expect(snapshot).not.toHaveProperty("responseCache");
    });
});

describe("AniLink#getTransportState", () => {
    test("reflects breaker state driven through real client traffic", async () => {
        const client = new AniLink(undefined, {
            retry: false,
            circuitBreaker: { threshold: 1, cooldownMs: 60_000 },
        });

        // Before traffic: no recorded state at all.
        expect(client.getTransportState().anilist.circuit).toEqual([]);

        // One availability failure trips the breaker.
        mocks.request.mockRejectedValue(apiError(500));
        const media = client.anilist.query.media({ id: 1 });
        media.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(media).rejects.toBeInstanceOf(AniLinkApiError);

        const state = client.getTransportState();
        expect(state.anilist.circuit).toHaveLength(1);
        expect(state.anilist.circuit[0]).toMatchObject({
            host: "graphql.anilist.co",
            consecutiveFailures: 1,
            probeInFlight: false,
            failedProbes: 0,
        });
        expect(state.anilist.circuit[0].openedAt).not.toBeNull();
        // The MAL provider has its own owner: no cross-provider state.
        expect(state.mal.circuit).toEqual([]);
    });

    test("reflects the retry budget spent through real client traffic", async () => {
        const client = new AniLink(undefined, {
            retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1, jitter: false },
            retryBudget: { maxRetriesPerWindow: 2, windowMs: 60_000 },
        });

        // One request: initial attempt + 2 retries spends the budget.
        mocks.request.mockRejectedValue(apiError(500));
        const media = client.anilist.query.media({ id: 1 });
        media.catch(() => {});
        await vi.advanceTimersByTimeAsync(100);
        await expect(media).rejects.toBeInstanceOf(AniLinkApiError);

        const state = client.getTransportState();
        expect(state.anilist.retryBudget).toEqual({
            retriesUsed: 2,
            windowEndsAt: expect.any(Number),
        });
    });

    test("reflects a pacing deadline recorded through real client traffic", async () => {
        const client = new AniLink(undefined, { paceWithRateLimit: true });

        // A successful response with an exhausted quota records a deadline.
        mocks.request.mockResolvedValueOnce({
            data: { data: { Media: { id: 1 } } },
            headers: {
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "0",
                "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
            },
        });
        await expect(client.anilist.query.media({ id: 1 })).resolves.toEqual({ id: 1 });

        const state = client.getTransportState();
        expect(state.anilist.paceDeadlines).toEqual([
            { host: "graphql.anilist.co", deadlineMs: expect.any(Number) },
        ]);
        const deadline = state.anilist.paceDeadlines[0].deadlineMs;
        expect(deadline).toBeGreaterThan(Date.now());
        expect(deadline).toBeLessThanOrEqual(Date.now() + 60_500);
    });

    test("returns a fresh, frozen copy per call without mutating live state", async () => {
        const client = new AniLink(undefined, {
            retry: false,
            circuitBreaker: { threshold: 1, cooldownMs: 60_000 },
        });

        mocks.request.mockRejectedValue(apiError(500));
        const media = client.anilist.query.media({ id: 1 });
        media.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(media).rejects.toBeInstanceOf(AniLinkApiError);

        const first = client.getTransportState();
        const second = client.getTransportState();
        expect(first).not.toBe(second);
        expect(first.anilist.circuit[0].openedAt).toBe(second.anilist.circuit[0].openedAt);
        expect(Object.isFrozen(first.anilist)).toBe(true);
        // The per-provider wrapper object is frozen too, matching the
        // documented "every nested object and array is deep-frozen"
        // contract — a consumer cannot swap a provider's snapshot out.
        expect(Object.isFrozen(first)).toBe(true);
        expect(Object.isFrozen(second)).toBe(true);
    });

    test("keeps provider state isolated: MAL traffic never lands in the AniList snapshot", async () => {
        const client = new AniLink({
            anilist: { authToken: "anilist-token" },
            mal: {
                accessToken: "mal-token",
                retry: false,
                circuitBreaker: { threshold: 1, cooldownMs: 60_000 },
            },
        });

        // One availability failure through MAL trips the MAL breaker.
        mocks.request.mockRejectedValue(apiError(500));
        const first = client.mal.user.me();
        first.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(first).rejects.toBeInstanceOf(AniLinkRestError);

        // The next MAL call fast-fails through the same owner's breaker.
        const second = client.mal.user.me();
        second.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(second).rejects.toMatchObject({ code: AniLinkErrorCodes.CIRCUIT });

        const state = client.getTransportState();
        expect(state.mal.circuit).toHaveLength(1);
        expect(state.mal.circuit[0].host).toBe("api.myanimelist.net");
        expect(state.anilist.circuit).toEqual([]);
    });
});

describe("buildProviderClients stateOwners", () => {
    test("exposes per-provider state owners that key the clients' shared state", async () => {
        const clients = buildProviderClients({
            anilist: {
                authToken: "anilist-token",
                retry: false,
                circuitBreaker: { threshold: 1, cooldownMs: 60_000 },
            },
            mal: { accessToken: "mal-token" },
        });

        expect(clients.stateOwners.anilist).toBeInstanceOf(Object);
        expect(clients.stateOwners.mal).toBeInstanceOf(Object);
        expect(clients.stateOwners.anilist).not.toBe(clients.stateOwners.mal);

        // The owners are the objects the clients actually key state
        // through: driving AniList traffic records breaker state under the
        // anilist owner only.
        mocks.request.mockRejectedValue(apiError(500));
        const media = clients.anilist.query.media({ id: 1 });
        media.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(media).rejects.toBeInstanceOf(AniLinkApiError);

        const anilistSnapshot = snapshotTransportState(clients.stateOwners.anilist);
        expect(anilistSnapshot.circuit).toHaveLength(1);
        expect(snapshotTransportState(clients.stateOwners.mal).circuit).toEqual([]);
    });
});
