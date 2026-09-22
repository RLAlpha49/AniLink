import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { AxiosResponse, AxiosStatic } from "axios";
import { AniLinkErrorCodes } from "../src/base/AniLinkError";
import type { ResolvedRequestOptions } from "../src/base/requestOptions";
import type { RequestContext } from "../src/base/transportTypes";

/**
 * Direct tests for the rate-limit pacing helpers in `src/base/pacing.ts`.
 *
 * The request-handler suite exercises pacing only through full request
 * pipelines, which left the deadline bookkeeping, the `onPace` payload, and
 * the pacing-abort classification untested at the unit level.
 *
 * The global setup replaces `axios` with a network-blocking stub without
 * `isCancel`, so this suite installs an axios double with a working
 * `isCancel` before importing the module under test.
 */

const { axiosStub } = vi.hoisted(() => {
    const isCancel = (error: unknown): boolean =>
        Boolean((error as { isCanceled?: boolean } | null)?.isCanceled);
    const stub = Object.assign(vi.fn(), {
        create: vi.fn(),
        isAxiosError: (error: unknown) =>
            Boolean((error as { isAxiosError?: boolean } | null)?.isAxiosError),
        isCancel,
    });
    return { axiosStub: stub as unknown as AxiosStatic & { isCancel: (e: unknown) => boolean } };
});

vi.mock("axios", () => ({ __esModule: true, default: axiosStub }));

// Deterministic stagger for the tests that need to land an abort inside
// the stagger window: the real `randomInt` can draw any bound in
// [0, jitterBound], so a fixed 500ms draw makes the sleep length exact.
const { randomIntMock } = vi.hoisted(() => ({ randomIntMock: vi.fn() }));
vi.mock("node:crypto", async (importOriginal) => {
    const actual = await importOriginal<typeof import("node:crypto")>();
    return { ...actual, randomInt: randomIntMock };
});

import {
    awaitPaceDeadline,
    paceAfterSuccess,
    peekPaceDeadlines,
    recordPaceDeadline,
} from "../src/base/pacing";

const hookContext: RequestContext = {
    requestId: "req-pace-1",
    url: "https://graphql.anilist.co",
    method: "POST",
    attempt: 1,
};

const resolvedBase = {
    timeout: 1000,
    exposeRawAxiosError: false,
    retry: null,
    paceWithRateLimit: true,
    rateLimitFloor: 90,
    httpAgent: {} as never,
    httpsAgent: {} as never,
    ignorePaceDeadline: false,
    allowPartialData: false,
    bypassResponseCache: false,
    diagnostics: "warn",
} satisfies Partial<ResolvedRequestOptions> as ResolvedRequestOptions;

const response = (headers: Record<string, string>) => ({ headers }) as unknown as AxiosResponse;

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    // Default draw matching the real `randomInt(max)`: [0, max). Tests that
    // need a deterministic stagger override this with mockReturnValueOnce.
    randomIntMock.mockImplementation((max: number) => Math.floor(Math.random() * max));
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("recordPaceDeadline", () => {
    test("stores a future deadline for the owner and host", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5000);
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        // The wait is still pending; onPace has not fired yet — it fires
        // after the wait completes so an aborted wait never emits a
        // full-delay event.
        expect(onPace).not.toHaveBeenCalled();
        // The sleep carries a random stagger bounded at a tenth of the
        // wait (capped at 500ms), so advancing past wait + bound settles it.
        vi.advanceTimersByTime(5500);
        await expect(wait).resolves.toBeTypeOf("number");
        expect(onPace).toHaveBeenCalledTimes(1);
        expect(onPace.mock.calls[0][0].delayMs).toBe(5000);
        expect(onPace.mock.calls[0][0].requestId).toBe("req-pace-1");
        // A completed wait never carries the aborted flag.
        expect(onPace.mock.calls[0][0]).not.toHaveProperty("aborted");
    });

    test("clears the deadline when the reset time is now or in the past", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() - 1000);
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("keeps the later of two deadlines for the same owner and host", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 1000);
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 8000);
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        vi.advanceTimersByTime(8800);
        await expect(wait).resolves.toBeTypeOf("number");
        expect(onPace.mock.calls[0][0].delayMs).toBe(8000);
    });

    test("does not replace a later deadline with an earlier one", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 9000);
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 1000);
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        vi.advanceTimersByTime(9900);
        await expect(wait).resolves.toBeTypeOf("number");
        expect(onPace.mock.calls[0][0].delayMs).toBe(9000);
    });

    test("scopes deadlines per host under one owner", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5000);
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "api.myanimelist.net",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("evicts the least-recently-used host once the per-owner cap is reached", async () => {
        const owner = {};
        // Fill the owner's map to the cap: 64 hosts, host-0 recorded first.
        for (let i = 0; i < 64; i += 1) {
            recordPaceDeadline(owner, `host-${i}.example.com`, Date.now() + 60_000);
        }
        // Re-recording host-0 refreshes its recency, so host-1 becomes the
        // least-recently-used entry.
        recordPaceDeadline(owner, "host-0.example.com", Date.now() + 60_000);
        // Recording a 65th distinct host evicts the LRU entry — host-1,
        // not the refreshed host-0.
        recordPaceDeadline(owner, "host-64.example.com", Date.now() + 60_000);
        expect(peekPaceDeadlines(owner)?.size).toBe(64);
        expect(peekPaceDeadlines(owner)?.has("host-0.example.com")).toBe(true);
        expect(peekPaceDeadlines(owner)?.has("host-1.example.com")).toBe(false);

        // The evicted host no longer paces; the refreshed host still does.
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "host-1.example.com",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
        const wait = awaitPaceDeadline(
            owner,
            "host-0.example.com",
            { ...resolvedBase, onPace },
            hookContext
        );
        vi.advanceTimersByTime(60_500);
        await expect(wait).resolves.toBeTypeOf("number");
        expect(onPace).toHaveBeenCalledTimes(1);
    });

    test("refreshes recency when a host's deadline is awaited", async () => {
        const owner = {};
        for (let i = 0; i < 64; i += 1) {
            recordPaceDeadline(owner, `host-${i}.example.com`, Date.now() + 60_000);
        }
        // Awaiting host-0's deadline refreshes its recency even while the
        // wait is still pending, so a later eviction spares host-0 and
        // takes host-1 instead.
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "host-0.example.com",
            { ...resolvedBase, onPace },
            hookContext
        );
        recordPaceDeadline(owner, "host-64.example.com", Date.now() + 60_000);
        expect(peekPaceDeadlines(owner)?.has("host-0.example.com")).toBe(true);
        expect(peekPaceDeadlines(owner)?.has("host-1.example.com")).toBe(false);
        vi.advanceTimersByTime(60_500);
        await expect(wait).resolves.toBeTypeOf("number");
        expect(onPace).toHaveBeenCalledTimes(1);
    });
});

describe("awaitPaceDeadline", () => {
    test("does nothing when no owner is provided", async () => {
        const onPace = vi.fn();
        await awaitPaceDeadline(
            undefined,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("does nothing when pacing is disabled", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5000);
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace, paceWithRateLimit: false },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("does nothing when ignorePaceDeadline is set", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5000);
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace, ignorePaceDeadline: true },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("clears a stale deadline that has already passed and dispatches immediately", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 1000);
        vi.advanceTimersByTime(1500);
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
        // A second await must also not pace: the stale entry was removed.
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("classifies an abort during the wait as a pacing abort", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5000);
        const controller = new AbortController();
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, signal: controller.signal, onPace },
            hookContext
        );
        // Abort partway through the wait: the emission must report the
        // elapsed portion with the aborted flag, never the full deadline.
        vi.advanceTimersByTime(2000);
        controller.abort();
        await expect(wait).rejects.toMatchObject({
            code: AniLinkErrorCodes.ABORTED,
            abortedDuringPacing: true,
        });
        expect(onPace).toHaveBeenCalledTimes(1);
        expect(onPace.mock.calls[0][0]).toMatchObject({
            delayMs: 2000,
            aborted: true,
        });
    });

    test("jitters the sleep but reports the true deadline wait in onPace", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 10_000);
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        // The stagger is bounded at a tenth of the wait (capped at 500ms),
        // so the sleep lands somewhere in [10_000, 10_500]: still pending
        // just before the deadline, settled just past the bound.
        vi.advanceTimersByTime(9_999);
        expect(onPace).not.toHaveBeenCalled();
        vi.advanceTimersByTime(501);
        await expect(wait).resolves.toBeTypeOf("number");
        expect(onPace).toHaveBeenCalledTimes(1);
        // The payload reports the true deadline wait, not the jittered
        // sleep, so pacing metrics stay comparable across waits.
        expect(onPace.mock.calls[0][0].delayMs).toBe(10_000);
        expect(onPace.mock.calls[0][0]).not.toHaveProperty("aborted");
    });

    test("clamps an abort landing inside the stagger window to the deadline wait", async () => {
        // The sleep is deadline + stagger, so an abort can land after the
        // deadline has elapsed but before the staggered sleep settles. The
        // aborted emission must report at most the deadline wait — never
        // the stagger-inclusive elapsed time, which would exceed even a
        // completed wait's delayMs for the same deadline.
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 10_000);
        // Pin the stagger to its full 500ms bound so the sleep is exactly
        // 10_500ms and the abort lands deterministically inside the
        // stagger window.
        randomIntMock.mockReturnValueOnce(500);
        const controller = new AbortController();
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, signal: controller.signal, onPace },
            hookContext
        );
        // Advance past the deadline (10s) but not the staggered sleep
        // (10.5s), then abort: the elapsed wall time is 10_200ms, over the
        // deadline, but the report must be clamped to the deadline wait.
        vi.advanceTimersByTime(10_200);
        controller.abort();
        await expect(wait).rejects.toMatchObject({
            code: AniLinkErrorCodes.ABORTED,
            abortedDuringPacing: true,
        });
        expect(onPace).toHaveBeenCalledTimes(1);
        expect(onPace.mock.calls[0][0]).toMatchObject({
            aborted: true,
        });
        // Clamped to the deadline wait, never the stagger-inclusive elapsed.
        expect(onPace.mock.calls[0][0].delayMs).toBe(10_000);
    });

    test("resolves with the observed deadline wait, stagger excluded", async () => {
        // The caller accumulates the resolved value into its cumulative
        // pacedMs metric, so it must be the same stagger-excluded measure
        // onPace reports — never the jittered sleep length.
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 10_000);
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase },
            hookContext
        );
        vi.advanceTimersByTime(10_500);
        await expect(wait).resolves.toBe(10_000);
    });

    test("resolves with 0 when the dispatch is not paced", async () => {
        const owner = {};
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase },
            hookContext
        );
        await expect(wait).resolves.toBe(0);
    });
});

describe("paceAfterSuccess", () => {
    test("records the deadline without waiting: the response returns immediately", async () => {
        const owner = {};
        const reset = Math.ceil((Date.now() + 3000) / 1000);
        // Synchronous call — no await, no timer advance: the successful
        // response is never held for the window reset.
        paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "5",
                "x-ratelimit-reset": String(reset),
            }),
            resolvedBase,
            undefined,
            owner,
            "graphql.anilist.co"
        );
        // The deadline is already recorded: a subsequently dispatched request
        // to the same host waits for it, and onPace fires only from that
        // pre-dispatch wait.
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
        vi.advanceTimersByTime(3300);
        await expect(wait).resolves.toBeTypeOf("number");
        expect(onPace).toHaveBeenCalledTimes(1);
        expect(onPace.mock.calls[0][0].delayMs).toBe(3000);
    });

    test("does not record a deadline when the remaining quota is at or above the floor", async () => {
        const owner = {};
        paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "90",
                "x-ratelimit-reset": String(Math.ceil((Date.now() + 3000) / 1000)),
            }),
            resolvedBase,
            undefined,
            owner,
            "graphql.anilist.co"
        );
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("does not record a deadline when pacing is disabled", async () => {
        const owner = {};
        paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "5",
                "x-ratelimit-reset": String(Math.ceil((Date.now() + 3000) / 1000)),
            }),
            { ...resolvedBase, paceWithRateLimit: false },
            undefined,
            owner,
            "graphql.anilist.co"
        );
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("does not record a deadline when the rate-limit headers are incomplete", async () => {
        const owner = {};
        paceAfterSuccess(
            response({ "x-ratelimit-remaining": "5" }),
            resolvedBase,
            undefined,
            owner,
            "graphql.anilist.co"
        );
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("prefers the provided rateLimit info over the response headers", async () => {
        const owner = {};
        const reset = Math.ceil((Date.now() + 3000) / 1000);
        paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "90",
                "x-ratelimit-reset": String(reset),
            }),
            resolvedBase,
            { limit: 90, remaining: 5, reset },
            owner,
            "graphql.anilist.co"
        );
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
        vi.advanceTimersByTime(3300);
        await expect(wait).resolves.toBeTypeOf("number");
        expect(onPace).toHaveBeenCalledTimes(1);
    });

    test("caps the recorded deadline at the maximum pacing window", async () => {
        const owner = {};
        const farFutureReset = Math.ceil((Date.now() + 60 * 60 * 1000) / 1000);
        paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "5",
                "x-ratelimit-reset": String(farFutureReset),
            }),
            resolvedBase,
            undefined,
            owner,
            "graphql.anilist.co"
        );
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
        // The cap is 5 minutes; advance past it (plus the stagger bound) so
        // the wait settles.
        vi.advanceTimersByTime(5 * 60 * 1000 + 500);
        await expect(wait).resolves.toBeTypeOf("number");
        const delay = onPace.mock.calls[0][0].delayMs;
        expect(delay).toBeGreaterThan(0);
        expect(delay).toBeLessThan(60 * 60 * 1000);
    });
});
