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
