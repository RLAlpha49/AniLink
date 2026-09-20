import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import http from "node:http";
import https from "node:https";
import {
    AniLinkApiError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
    AniLinkRestError,
} from "../src/base/AniLinkError";
import { type RequestOptions, sendRequest } from "../src/base/RequestHandler";
import { defaultHttpAgent, defaultHttpsAgent } from "../src/base/agents";
import { buildAniListWiring } from "../src/apis/graphql/anilist/wiring";
import { buildMyAnimeListApi } from "../src/apis/rest/mal/wiring";
import { getAxiosStub, makeAxiosResponseError as apiError } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build();
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

let pendingOptions: RequestOptions | undefined;
const callSendRequest = (
    url: string,
    method: "GET" | "POST",
    data?: object,
    contentType?: string
): Promise<unknown> =>
    sendRequest(url, method, data, undefined, {
        requiresAuth: false,
        options: pendingOptions,
        operation: undefined,
        contentType: contentType,
        stateOwner: pendingOptions,
    });

beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockImplementation(async () => ({ data: { data: { Media: { id: 1 } } } }));
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("AniLinkGraphQLError.status derives from the upstream GraphQL error", () => {
    test("surfaces the upstream status on error.status when the entry carries one", async () => {
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "Not Found.", status: 404 }], data: null },
        });

        const error = await callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        }).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
        expect((error as AniLinkGraphQLError).status).toBe(404);
    });

    test("falls back to the 200 envelope status when no entry carries a status", async () => {
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "Not authenticated." }], data: null },
        });

        const error = await callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        }).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
        expect((error as AniLinkGraphQLError).status).toBe(200);
    });

    test("ignores non-numeric upstream statuses and falls back to 200", async () => {
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "weird", status: "INTERNAL" }], data: null },
        });

        const error = await callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        }).catch((requestError: unknown) => requestError);

        expect((error as AniLinkGraphQLError).status).toBe(200);
    });

    test("retries a 200-envelope GraphQL failure carrying an upstream 500", async () => {
        mocks.request
            .mockResolvedValueOnce({
                data: { errors: [{ message: "server fault", status: 500 }] },
            })
            .mockResolvedValueOnce({ data: { data: { Media: { id: 8 } } } });

        pendingOptions = { retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 } };

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(10);
        await expect(promise).resolves.toEqual({ id: 8 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("does not retry a 200-envelope GraphQL failure with a non-retryable upstream status", async () => {
        mocks.request.mockResolvedValue({
            data: { errors: [{ message: "Not Found.", status: 404 }] },
        });

        pendingOptions = { retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 } };

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(100);
        await expect(promise).rejects.toBeInstanceOf(AniLinkGraphQLError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });
});

describe("REST failures surface as AniLinkRestError", () => {
    test("produces AniLinkRestError for an HTTP failure on a REST (content-type) call", async () => {
        mocks.request.mockRejectedValueOnce(apiError(404, {}, { message: "not found" }));

        const error = await callSendRequest(
            "https://api.myanimelist.net/v2/anime/1",
            "GET",
            undefined,
            "application/json"
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkRestError);
        expect(error).toBeInstanceOf(AniLinkApiError);
        expect(error).toMatchObject({ name: "AniLinkRestError", code: "REST_ERROR", status: 404 });
    });

    test("still produces a plain AniLinkApiError for a GraphQL (no content-type) call", async () => {
        mocks.request.mockRejectedValueOnce(apiError(500));

        pendingOptions = { retry: false };

        const error = await callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        }).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkApiError);
        expect(error).not.toBeInstanceOf(AniLinkRestError);
        expect(error).toMatchObject({ name: "AniLinkApiError", status: 500 });
    });

    test("produces AniLinkRestError when a REST call fails on a retry-exhausted request", async () => {
        mocks.request.mockRejectedValue(apiError(503));

        pendingOptions = { retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 1 } };

        const promise = callSendRequest(
            "https://api.myanimelist.net/v2/anime/1",
            "GET",
            undefined,
            "application/json"
        );
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(100);
        await expect(promise).rejects.toBeInstanceOf(AniLinkRestError);
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });
});

describe("Configurable socket pool", () => {
    test("exposes MAX_SOCKETS and MAX_FREE_SOCKETS defaults", async () => {
        const handler = await import("../src/base/RequestHandler");
        expect(handler.MAX_SOCKETS).toBe(20);
        expect(handler.MAX_FREE_SOCKETS).toBe(5);
    });

    test("forwards dedicated agents on the axios call when socket bounds are customized", async () => {
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: { maxSockets: 44, maxFreeSockets: 7 },
        });

        const config = mocks.request.mock.calls.at(-1)?.[0] as {
            httpAgent?: unknown;
            httpsAgent?: unknown;
        };
        // Custom bounds must not reuse the shared default agents.
        expect(config.httpAgent).not.toBe(defaultHttpAgent);
        expect(config.httpsAgent).not.toBe(defaultHttpsAgent);
        expect(config.httpAgent).toBeInstanceOf(http.Agent);
        expect(config.httpsAgent).toBeInstanceOf(https.Agent);
    });

    test("reuses the shared default agents when the socket bounds are unset", async () => {
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        const first = mocks.request.mock.calls.at(-1)?.[0] as {
            httpAgent?: unknown;
            httpsAgent?: unknown;
        };
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        const second = mocks.request.mock.calls.at(-1)?.[0] as {
            httpAgent?: unknown;
            httpsAgent?: unknown;
        };

        expect(first.httpAgent).toBe(defaultHttpAgent);
        expect(first.httpsAgent).toBe(defaultHttpsAgent);
        // The default path is allocation-free: both calls share the same
        // module-level keep-alive pool.
        expect(second.httpAgent).toBe(first.httpAgent);
        expect(second.httpsAgent).toBe(first.httpsAgent);
    });
});

describe("Per-window retry budget", () => {
    test("fail-fast once the retry budget for the window is exhausted", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        pendingOptions = {
            retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 },
            retryBudget: { maxRetriesPerWindow: 2, windowMs: 60_000 },
        };

        // First request: initial attempt + 2 retries spends the whole budget.
        const first = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        first.catch(() => {});
        await vi.advanceTimersByTimeAsync(100);
        await expect(first).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(3);

        // Second request within the same window: the initial attempt is sent,
        // but its failures are not retried because the budget is spent.
        const second = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        second.catch(() => {});
        await vi.advanceTimersByTimeAsync(100);
        await expect(second).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(4);
    });

    test("restores the retry budget once the window elapses", async () => {
        mocks.request
            .mockRejectedValueOnce(apiError(500))
            .mockRejectedValueOnce(apiError(500))
            .mockRejectedValueOnce(apiError(500))
            .mockResolvedValueOnce({ data: { data: { Media: { id: 9 } } } });

        pendingOptions = {
            retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 },
            retryBudget: { maxRetriesPerWindow: 1, windowMs: 1_000 },
        };

        // First request spends the single retry in the window.
        const first = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        first.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(first).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(2);

        // Advance past the window, budget resets, and the request succeeds.
        await vi.advanceTimersByTimeAsync(1_001);
        const second = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        second.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(second).resolves.toEqual({ id: 9 });
        // initial + 1 retry (first request, budget spent) + initial + 1 retry
        // (second request, budget restored) = 4 calls.
        expect(mocks.request).toHaveBeenCalledTimes(4);
    });

    test("does not exhaust the budget while failures are not retried", async () => {
        mocks.request.mockRejectedValue(apiError(404));

        pendingOptions = {
            retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 },
            retryBudget: { maxRetriesPerWindow: 1, windowMs: 60_000 },
        };

        // 404s are not retried, so no budget is spent.
        for (let call = 0; call < 3; call += 1) {
            const promise = callSendRequest("https://graphql.anilist.co", "POST", {
                query: "query",
            });
            promise.catch(() => {});
            await vi.advanceTimersByTimeAsync(10);
            await expect(promise).rejects.toBeInstanceOf(AniLinkApiError);
            expect(mocks.request).toHaveBeenCalledTimes(call + 1);
        }
    });

    test("leaves retry behavior unchanged when no budget is configured", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        pendingOptions = { retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 1 } };

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});
        await vi.advanceTimersByTimeAsync(100);
        await expect(promise).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(3);
    });

    test("surfaces immediately when a Retry-After delay outlasts the budget window", async () => {
        // A 60s server-dictated delay cannot fit inside a 30s window: the
        // failure surfaces on the first attempt instead of parking the
        // caller past the window the budget was configured to bound.
        mocks.request.mockRejectedValue(apiError(429, { "retry-after": "60" }));

        pendingOptions = {
            retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 },
            retryBudget: { maxRetriesPerWindow: 2, windowMs: 30_000 },
        };

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});
        await vi.advanceTimersByTimeAsync(100);
        await expect(promise).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(1);

        // Surfacing spent no budget unit: a later failure in the same window
        // still earns its retries.
        mocks.request
            .mockRejectedValueOnce(apiError(500))
            .mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });
        const second = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        second.catch(() => {});
        await vi.advanceTimersByTimeAsync(100);
        await expect(second).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(3);
    });

    test("still retries a 429 whose Retry-After fits inside the budget window", async () => {
        mocks.request
            .mockRejectedValueOnce(apiError(429, { "retry-after": "1" }))
            .mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });

        pendingOptions = {
            retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 },
            retryBudget: { maxRetriesPerWindow: 2, windowMs: 120_000 },
        };

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});
        await vi.advanceTimersByTimeAsync(1_100);
        await expect(promise).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });
});

describe("Interaction: circuit breaker still fast-fails after opening", () => {
    test("an open circuit throws the network error without a request", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        pendingOptions = {
            retry: false,
            circuitBreaker: { threshold: 1, cooldownMs: 60_000 },
        };

        const first = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        first.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(first).rejects.toBeInstanceOf(AniLinkApiError);

        const second = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        second.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(second).rejects.toBeInstanceOf(AniLinkNetworkError);
        await expect(second).rejects.toMatchObject({ code: "CIRCUIT_OPEN_ERROR" });
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });
});

describe("Shared per-client state owner threaded through the provider wirings", () => {
    test("a breaker tripped through one AniList operation fast-fails a different operation", async () => {
        // The wiring-level regression for the shared state owner: the client
        // is built exactly as production builds it, so the breaker state must
        // span operations — a streak recorded by `query.media` gates
        // `query.user` without a second HTTP attempt.
        const client = buildAniListWiring(undefined, {
            retry: false,
            circuitBreaker: { threshold: 1, cooldownMs: 60_000 },
        });

        mocks.request.mockRejectedValue(apiError(500));

        // One availability failure through `query.media` trips the breaker.
        const media = client.query.media({ id: 1 });
        media.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(media).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(1);

        // A different operation of the same client fast-fails with
        // CIRCUIT_OPEN_ERROR before any request is sent.
        const user = client.query.user({ id: 1 });
        user.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(user).rejects.toBeInstanceOf(AniLinkNetworkError);
        await expect(user).rejects.toMatchObject({ code: AniLinkErrorCodes.CIRCUIT });
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("a breaker tripped through one MAL operation fast-fails a different operation", async () => {
        // MAL-side equivalent: the three REST operations share one state
        // owner, so a streak on `anime.get` gates `user.me`.
        const api = buildMyAnimeListApi({
            accessToken: "mal-access-token",
            retry: false,
            circuitBreaker: { threshold: 1, cooldownMs: 60_000 },
        });

        mocks.request.mockRejectedValue(apiError(500));

        const anime = api.anime.get({ id: 21 });
        anime.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(anime).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(1);

        const me = api.user.me();
        me.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(me).rejects.toBeInstanceOf(AniLinkNetworkError);
        await expect(me).rejects.toMatchObject({ code: AniLinkErrorCodes.CIRCUIT });
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("a retry budget spent through one operation surfaces a different operation's failure without retry", async () => {
        // The budget spans the client: the single retry `query.media`
        // spends the window's only unit, so `query.user`'s 500 surfaces
        // after one attempt instead of retrying against a fresh
        // per-operation budget.
        const client = buildAniListWiring(undefined, {
            retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1, jitter: false },
            retryBudget: { maxRetriesPerWindow: 1, windowMs: 120_000 },
        });

        // `query.media`: one retryable failure, then success.
        mocks.request
            .mockRejectedValueOnce(apiError(500))
            .mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });
        const media = client.query.media({ id: 1 });
        media.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(media).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);

        // `query.user`: the shared budget is exhausted, so the failure
        // surfaces with no second attempt.
        mocks.request.mockRejectedValue(apiError(500));
        const user = client.query.user({ id: 1 });
        user.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(user).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(3);
    });

    test("a rate-limit deadline recorded by one operation gates another operation's dispatch", async () => {
        // The pacing deadline spans the client: the exhausted quota
        // `query.media` observed gates `query.user`'s dispatch until the
        // window resets.
        const client = buildAniListWiring(undefined, { paceWithRateLimit: true });

        mocks.request
            .mockResolvedValueOnce({
                data: { data: { Media: { id: 1 } } },
                headers: {
                    "x-ratelimit-limit": "90",
                    "x-ratelimit-remaining": "0",
                    "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
                },
            })
            .mockResolvedValueOnce({ data: { data: { User: { id: 1 } } } });

        // First call: dispatches, records the 60s deadline, and returns its
        // data immediately — the response is never held for the window.
        const media = client.query.media({ id: 1 });
        await expect(media).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(1);

        // Second operation: gated by the recorded deadline well into the
        // 60s window.
        const user = client.query.user({ id: 1 });
        user.catch(() => {});
        await vi.advanceTimersByTimeAsync(30_000);
        expect(mocks.request).toHaveBeenCalledTimes(1);

        // Past the deadline the pre-dispatch gate releases; the second
        // operation dispatches and resolves.
        await vi.advanceTimersByTimeAsync(35_000);
        await expect(user).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });
});

describe("Circuit accounting for partial-success envelopes", () => {
    test("an availability-class partial envelope advances the breaker instead of resetting it", async () => {
        // A partial envelope resolved by allowPartialData is a success for
        // the caller, but its error entries still carry upstream-health
        // signal. When an entry is availability-class (429/5xx), the
        // breaker must account for it like the strict mode's throw would:
        // the failure streak advances instead of resetting. Otherwise a
        // persistently degraded upstream that always fails one root field
        // keeps the breaker permanently closed under the opt-in while
        // tripping it under strict mode.
        pendingOptions = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 60_000 },
            allowPartialData: true,
        };

        // Two partial envelopes whose error entries carry status 500 —
        // the same upstream fault the strict mode would count.
        mocks.request.mockResolvedValueOnce({
            data: {
                data: { User: { id: 1 }, Page: { id: 2 } },
                errors: [{ message: "favourite failed", status: 500 }],
            },
        });
        const first = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });
        await vi.advanceTimersByTimeAsync(10);
        await expect(first).resolves.toEqual({
            data: { User: { id: 1 }, Page: { id: 2 } },
            errors: [{ message: "favourite failed", status: 500 }],
        });

        mocks.request.mockResolvedValueOnce({
            data: {
                data: { User: { id: 3 }, Page: { id: 4 } },
                errors: [{ message: "favourite failed", status: 500 }],
            },
        });
        const second = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });
        second.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(second).resolves.toEqual({
            data: { User: { id: 3 }, Page: { id: 4 } },
            errors: [{ message: "favourite failed", status: 500 }],
        });

        // The third request fast-fails: the two availability-class
        // partial envelopes advanced the streak to the threshold.
        const third = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });
        third.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(third).rejects.toMatchObject({ code: "CIRCUIT_OPEN_ERROR" });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("a status-less partial envelope leaves the breaker streak untouched", async () => {
        // A partial envelope whose error entries carry no upstream status
        // is streak-neutral: it may be a server fault that omitted its
        // status, so it must not reset the streak (a sustained outage
        // surfacing as status-less partial envelopes would otherwise erase
        // the streak other error classes accumulated), but it carries no
        // availability-class status either, so it must not advance the
        // streak — matching the strict mode's throw of the same error.
        pendingOptions = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 60_000 },
            allowPartialData: true,
        };

        // One availability-class partial envelope advances the streak to 1.
        mocks.request.mockResolvedValueOnce({
            data: {
                data: { User: { id: 1 }, Page: { id: 2 } },
                errors: [{ message: "favourite failed", status: 500 }],
            },
        });
        const first = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });
        await vi.advanceTimersByTimeAsync(10);
        await expect(first).resolves.toBeDefined();

        // A status-less partial envelope (no status on the error entry)
        // leaves the streak at 1 instead of resetting it.
        mocks.request.mockResolvedValueOnce({
            data: {
                data: { User: { id: 3 }, Page: { id: 4 } },
                errors: [{ message: "invalid argument" }],
            },
        });
        const second = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });
        await vi.advanceTimersByTimeAsync(10);
        await expect(second).resolves.toBeDefined();

        // The streak was not reset, so one more availability-class partial
        // envelope reaches the threshold of 2 and opens the breaker.
        mocks.request.mockResolvedValueOnce({
            data: {
                data: { User: { id: 5 }, Page: { id: 6 } },
                errors: [{ message: "favourite failed", status: 500 }],
            },
        });
        const third = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });
        third.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(third).resolves.toBeDefined();
        expect(mocks.request).toHaveBeenCalledTimes(3);

        // The breaker is open: the next request fast-fails without
        // touching the network.
        const fourth = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });
        fourth.catch(() => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(fourth).rejects.toMatchObject({ code: "CIRCUIT_OPEN_ERROR" });
        expect(mocks.request).toHaveBeenCalledTimes(3);
    });
});

describe("onResponse pacedMs stamping", () => {
    // Aligned to a whole second so `floor(now/1000) + N` reset headers
    // produce exactly N-second waits (a mid-second start would truncate
    // up to a second off the deadline).
    beforeEach(() => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    });

    test("a paced request carries pacedMs matching the pacing wait on onResponse", async () => {
        // R-030: without onPace pre-wired, a paced request must still be
        // identifiable in onResponse-based latency dashboards — the wait
        // length is stamped as pacedMs on the emission.
        const client = buildAniListWiring(undefined, { paceWithRateLimit: true });

        // First response reports an exhausted quota with a 2s reset window.
        mocks.request.mockResolvedValueOnce({
            data: { data: { Media: { id: 1 } } },
            headers: {
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "0",
                "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 2),
            },
        });
        const first = client.query.media({ id: 1 });
        await expect(first).resolves.toEqual({ id: 1 });

        // The next request waits the full 2s window before dispatching.
        mocks.request.mockResolvedValueOnce({ data: { data: { User: { id: 1 } } } });
        const onResponse = vi.fn();
        const second = client.query.user({ id: 1 }, { onResponse });
        second.catch(() => {});
        await vi.advanceTimersByTimeAsync(1_000);
        expect(mocks.request).toHaveBeenCalledTimes(1);
        // The pacing sleep carries a random stagger bounded at a tenth of
        // the wait (capped at 500ms), so the dispatch lands in (2s, 2.2s].
        await vi.advanceTimersByTimeAsync(1_300);
        await expect(second).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);

        // The paced emission carries the wait length; a non-paced
        // emission (the first response) carries no pacedMs at all. The
        // stagger is excluded from pacedMs, so it is exactly the 2s
        // deadline wait.
        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onResponse.mock.calls[0][0].pacedMs).toBe(2_000);
    });

    test("a request that never waits carries no pacedMs on onResponse", async () => {
        const client = buildAniListWiring(undefined, { paceWithRateLimit: true });

        const onResponse = vi.fn();
        const media = client.query.media({ id: 1 }, { onResponse });
        await expect(media).resolves.toEqual({ id: 1 });

        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onResponse.mock.calls[0][0]).not.toHaveProperty("pacedMs");
    });

    test("a failed attempt after a pacing wait carries pacedMs on the error-path onResponse", async () => {
        // The wait happened before dispatch; the attempt then failed. The
        // error-path onResponse emission must still show how long the
        // request waited so the failure report is not mistaken for a hung
        // upstream.
        const client = buildAniListWiring(undefined, { paceWithRateLimit: true });

        mocks.request.mockResolvedValueOnce({
            data: { data: { Media: { id: 1 } } },
            headers: {
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "0",
                "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 2),
            },
        });
        const first = client.query.media({ id: 1 });
        await expect(first).resolves.toEqual({ id: 1 });

        mocks.request.mockRejectedValueOnce(apiError(500));
        const onResponse = vi.fn();
        const second = client.query.user({ id: 1 }, { onResponse, retry: false });
        second.catch(() => {});
        // The stagger-bounded sleep lands in (2s, 2.2s].
        await vi.advanceTimersByTimeAsync(2_300);
        await expect(second).rejects.toBeInstanceOf(AniLinkApiError);

        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onResponse.mock.calls[0][0].pacedMs).toBe(2_000);
    });

    test("a pacing wait before a failed attempt is stamped on the retried attempt's onResponse", async () => {
        // The wait counter is accumulated across the attempts of one
        // logical request: attempt 1 waits the recorded deadline, then
        // fails; attempt 2 finds the deadline elapsed (it was consumed by
        // attempt 1's wait) and dispatches immediately. The successful
        // retry's onResponse must still carry attempt 1's wait — without
        // the cross-attempt accumulation, the paced request would look
        // unpaced in the final emission.
        const client = buildAniListWiring(undefined, {
            paceWithRateLimit: true,
            retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 1, jitter: false },
        });

        // Prime a 1s deadline for the host.
        mocks.request.mockResolvedValueOnce({
            data: { data: { Media: { id: 1 } } },
            headers: {
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "0",
                "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 1),
            },
        });
        const primer = client.query.media({ id: 1 });
        await expect(primer).resolves.toEqual({ id: 1 });

        // Attempt 1: waits the 1s deadline, then fails with a 500.
        mocks.request.mockRejectedValueOnce(apiError(500));
        mocks.request.mockResolvedValueOnce({ data: { data: { User: { id: 1 } } } });

        const onResponse = vi.fn();
        const request = client.query.user({ id: 1 }, { onResponse });
        request.catch(() => {});
        // Attempt 1's 1s pacing wait (plus a stagger bounded at 100ms) +
        // 1ms retry backoff; attempt 2 dispatches immediately (the
        // deadline elapsed during attempt 1's wait) and resolves.
        await vi.advanceTimersByTimeAsync(1_200);
        await expect(request).resolves.toEqual({ id: 1 });

        // Both attempts emitted onResponse, and both carry the wait:
        // attempt 1's own error-path emission reports exactly the 1s it
        // waited (stagger excluded), and the retry's emission reports the
        // accumulated total.
        expect(onResponse).toHaveBeenCalledTimes(2);
        expect(onResponse.mock.calls[0][0].pacedMs).toBe(1_000);
        expect(onResponse.mock.calls[1][0].pacedMs).toBe(onResponse.mock.calls[0][0].pacedMs);
    });
});
