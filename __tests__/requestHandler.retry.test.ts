import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkGraphQLError,
    AniLinkNetworkError,
    AniLinkValidationError,
} from "../src/base/AniLinkError";
import { type RequestOptions, sendRequest } from "../src/base/RequestHandler";
import { computeNextRetryDelay } from "../src/base/retry";
import {
    getAxiosStub,
    makeAxiosCancelError,
    makeAxiosResponseError as apiError,
} from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build();
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

// Transport settings are passed per request since the global
// `configureRequestOptions` setter was removed.
let pendingOptions: RequestOptions | undefined;
// Fake-timer timestamp captured before each test so tests can assert that no
// hidden pacing delay elapsed.
let startedAt = 0;
const configureRequestOptions = (options: RequestOptions): void => {
    pendingOptions = options;
};
const callSendRequest = (url: string, method: "GET" | "POST", data?: object): Promise<unknown> =>
    sendRequest(url, method, data, undefined, {
        requiresAuth: false,
        options: pendingOptions,
    });

beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockImplementation(async () => ({ data: { data: { Media: { id: 1 } } } }));
    vi.useFakeTimers();
    startedAt = Date.now();
    configureRequestOptions({});
});

afterEach(() => {
    vi.useRealTimers();
});

describe("retry with backoff", () => {
    test("retries a 429 and succeeds on the second attempt", async () => {
        mocks.request
            .mockRejectedValueOnce(apiError(429, { "retry-after": "0" }))
            .mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });

        configureRequestOptions({ retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 } });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query { Media(id: 1) { id } }",
        });

        await vi.advanceTimersByTimeAsync(10);
        await expect(promise).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("retries a 5xx response", async () => {
        mocks.request
            .mockRejectedValueOnce(apiError(500))
            .mockResolvedValueOnce({ data: { data: { Media: { id: 2 } } } });

        configureRequestOptions({ retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 } });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query { Media(id: 2) { id } }",
        });

        await vi.advanceTimersByTimeAsync(10);
        await expect(promise).resolves.toEqual({ id: 2 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("retries a network error", async () => {
        mocks.request
            .mockRejectedValueOnce({
                isAxiosError: true,
                code: "ERR_NETWORK",
                message: "socket hang up",
            })
            .mockResolvedValueOnce({ data: { data: { Media: { id: 3 } } } });

        configureRequestOptions({ retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 } });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query { Media(id: 3) { id } }",
        });

        await vi.advanceTimersByTimeAsync(10);
        await expect(promise).resolves.toEqual({ id: 3 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("gives up after maxRetries and throws the normalized error", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({ retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 1 } });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query { Media(id: 4) { id } }",
        });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(100);
        await expect(promise).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    test("does not retry when retry is disabled", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({ retry: false });

        await expect(
            callSendRequest("https://graphql.anilist.co", "POST", { query: "query" })
        ).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("retries under the default policy when no retry option is given", async () => {
        mocks.request
            .mockRejectedValueOnce(apiError(500))
            .mockResolvedValueOnce({ data: { data: { Media: { id: 5 } } } });

        configureRequestOptions({});

        const promise = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });

        await vi.advanceTimersByTimeAsync(10_000);
        await expect(promise).resolves.toEqual({ id: 5 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("retries with the default policy when retry is true", async () => {
        mocks.request
            .mockRejectedValueOnce(apiError(500))
            .mockResolvedValueOnce({ data: { data: { Media: { id: 6 } } } });

        configureRequestOptions({ retry: true });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query { Media(id: 6) { id } }",
        });

        await vi.advanceTimersByTimeAsync(10_000);
        await expect(promise).resolves.toEqual({ id: 6 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("does not retry a 4xx status outside the retry set", async () => {
        mocks.request.mockRejectedValue(apiError(400));

        configureRequestOptions({ retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 } });

        await expect(
            callSendRequest("https://graphql.anilist.co", "POST", { query: "query" })
        ).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("does not retry an aborted request", async () => {
        mocks.request.mockRejectedValue({
            isAxiosError: true,
            isCanceled: true,
            code: "ERR_CANCELED",
        });

        configureRequestOptions({ retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 } });

        await expect(
            callSendRequest("https://graphql.anilist.co", "POST", { query: "query" })
        ).rejects.toBeInstanceOf(AniLinkNetworkError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("rejects immediately when the retry signal is already aborted", async () => {
        const controller = new AbortController();
        controller.abort();
        mocks.request.mockRejectedValueOnce(apiError(500));

        configureRequestOptions({
            signal: controller.signal,
            retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 1, jitter: false },
        });

        await expect(
            callSendRequest("https://graphql.anilist.co", "POST", { query: "query" })
        ).rejects.toMatchObject({ code: "ABORTED_ERROR" });
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });
});

describe("onError hook", () => {
    test("invokes onError with the normalized error and context after retries are exhausted", async () => {
        mocks.request.mockRejectedValue(apiError(503));
        const onError = vi.fn();

        configureRequestOptions({
            retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 1 },
            onError,
        });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query { Media(id: 5) { id } }",
        });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(100);
        await expect(promise).rejects.toBeInstanceOf(AniLinkApiError);

        expect(onError).toHaveBeenCalledTimes(2);
        const [error, context] = onError.mock.calls[0] as [
            AniLinkApiError,
            { url: string; method: string; attempt: number; code: string; nextDelayMs?: number },
        ];
        expect(error).toBeInstanceOf(AniLinkApiError);
        expect(context).toEqual({
            requestId: expect.any(String),
            url: "https://graphql.anilist.co",
            method: "POST",
            attempt: 1,
            code: "API_ERROR",
            status: 503,
            nextDelayMs: expect.any(Number),
        });
    });
});

describe("retry hooks", () => {
    test("invokes the retry handler once per failed attempt before each backoff wait", async () => {
        mocks.request.mockRejectedValue(apiError(500));
        const onRetry = vi.fn();
        const onError = vi.fn();

        configureRequestOptions({
            retry: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 10 },
            onRetry,
            onError,
        });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(100);
        await expect(promise).rejects.toBeInstanceOf(AniLinkApiError);

        expect(onRetry).toHaveBeenCalledTimes(2); // once per failed attempt that will be retried
        expect(mocks.request).toHaveBeenCalledTimes(3); // initial + 2 retries
        const contexts = onRetry.mock.calls.map(
            (call) => call[1] as { attempt: number; nextDelayMs: number; status?: number }
        );
        expect(contexts.map((context) => context.attempt)).toEqual([1, 2]);
        for (const context of contexts) {
            expect(context.nextDelayMs).toBeGreaterThanOrEqual(0);
            expect(context.nextDelayMs).toBeLessThanOrEqual(10);
            expect(context.status).toBe(500);
        }
        // The terminal failure is reported by onError only.
        expect(onError).toHaveBeenCalledTimes(1);
        expect(
            (onError.mock.calls[0]?.[1] as { nextDelayMs?: number }).nextDelayMs
        ).toBeUndefined();
    });

    test("falls back to onError per attempt when no dedicated onRetry is configured", async () => {
        mocks.request.mockRejectedValue(apiError(500));
        const onError = vi.fn();

        configureRequestOptions({
            retry: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 10, jitter: false },
            onError,
        });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(100);
        await expect(promise).rejects.toBeInstanceOf(AniLinkApiError);

        // Two pre-retry invocations plus the terminal one.
        expect(onError).toHaveBeenCalledTimes(3);
        const [firstContext, terminalContext] = [
            onError.mock.calls[0]?.[1],
            onError.mock.calls.at(-1)?.[1],
        ] as [{ nextDelayMs?: number } | undefined, { nextDelayMs?: number } | undefined];
        // With jitter disabled the pre-retry delay is exactly the base delay.
        expect(firstContext?.nextDelayMs).toBe(10);
        expect(terminalContext?.nextDelayMs).toBeUndefined();
    });

    test("a throwing onRetry hook does not break the backoff wait", async () => {
        mocks.request
            .mockRejectedValueOnce(apiError(500))
            .mockResolvedValueOnce({ data: { data: { Media: { id: 9 } } } });
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        configureRequestOptions({
            retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 },
            onRetry: () => {
                throw new Error("retry sink failed");
            },
        });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });

        await vi.advanceTimersByTimeAsync(10);
        await expect(promise).resolves.toEqual({ id: 9 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
        expect(warn).toHaveBeenCalledWith(
            expect.stringMatching(
                /^\[AniLink\] onRetry hook threw and was ignored \(requestId: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\):$/
            ),
            "retry sink failed"
        );
        warn.mockRestore();
    });

    test("reports nextDelayMs matching Retry-After on a 429", async () => {
        mocks.request.mockRejectedValueOnce(apiError(429, { "retry-after": "7" }));
        const onRetry = vi.fn();

        configureRequestOptions({
            retry: { maxRetries: 3, baseDelayMs: 250, maxDelayMs: 5_000 },
            onRetry,
        });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(10_000);
        await expect(promise).resolves.toEqual({ id: 1 });

        expect(onRetry).toHaveBeenCalledTimes(1);
        const [, context] = onRetry.mock.calls[0] as [
            unknown,
            { attempt: number; nextDelayMs: number; code: string; status: number },
        ];
        expect(context.nextDelayMs).toBe(7_000);
        expect(context.status).toBe(429);
        expect(context.code).toBe("API_ERROR");
    });
});

describe("backoff jitter", () => {
    test("keeps computed delays within [0, raw exponential cap] across repeated computations", async () => {
        const onRetry = vi.fn();
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({
            retry: { maxRetries: 5, baseDelayMs: 1_000, maxDelayMs: 8_000 },
            onRetry,
        });

        // Each round produces one sample per attempt (attempts 1..5 report a
        // nextDelayMs computed from exponential caps 1000, 2000, 4000, 8000, 8000).
        for (let round = 0; round < 4; round += 1) {
            const promise = callSendRequest("https://graphql.anilist.co", "POST", {
                query: "query",
            });
            promise.catch(() => {});
            await vi.advanceTimersByTimeAsync(60_000);
            await expect(promise).rejects.toBeInstanceOf(AniLinkApiError);
        }

        expect(onRetry).toHaveBeenCalledTimes(20);
        const delays = onRetry.mock.calls.map(
            (call) => (call[1] as { nextDelayMs: number }).nextDelayMs
        );
        delays.forEach((delay, index) => {
            const attemptIndex = index % 5; // zero-based exponent of the failed attempt
            const rawCap = Math.min(1_000 * 2 ** attemptIndex, 8_000);
            expect(delay).toBeGreaterThanOrEqual(0);
            expect(delay).toBeLessThanOrEqual(rawCap);
        });
        // Full jitter must actually vary, not collapse to a constant delay.
        expect(new Set(delays).size).toBeGreaterThan(2);
    });
});

describe("Retry-After handling", () => {
    test.each([
        ["empty", ""],
        ["invalid", "not-a-date"],
        ["non-string", 7],
    ])("falls back to exponential backoff for a %s Retry-After header", async (_name, value) => {
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            code: "ERR_BAD_RESPONSE",
            response: { status: 429, data: {}, headers: { "retry-after": value } },
            config: {},
        });
        const onRetry = vi.fn();

        configureRequestOptions({
            retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 1, jitter: false },
            onRetry,
        });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });
        promise.catch(() => {});
        await vi.advanceTimersByTimeAsync(1);

        await expect(promise).resolves.toEqual({ id: 1 });
        expect(onRetry.mock.calls[0]?.[1]).toMatchObject({ nextDelayMs: 1 });
    });

    test("clamps an oversized Retry-After to the 60 second maximum", async () => {
        mocks.request.mockRejectedValueOnce(apiError(429, { "retry-after": "120" }));
        const onRetry = vi.fn();

        configureRequestOptions({ retry: true, onRetry });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(60_000);
        await expect(promise).resolves.toEqual({ id: 1 });

        const [, context] = onRetry.mock.calls[0] as [unknown, { nextDelayMs: number }];
        expect(context.nextDelayMs).toBeLessThanOrEqual(60_000);
        expect(context.nextDelayMs).toBe(60_000);
    });

    test("parses HTTP-date Retry-After headers in the past and future", async () => {
        const pastDate = new Date(Date.now() - 30_000).toUTCString();
        mocks.request.mockRejectedValueOnce(apiError(429, { "retry-after": pastDate }));
        const onRetryPast = vi.fn();

        configureRequestOptions({ retry: true, onRetry: onRetryPast });

        const pastPromise = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });
        pastPromise.catch(() => {});
        await vi.advanceTimersByTimeAsync(0);
        await expect(pastPromise).resolves.toEqual({ id: 1 });
        expect((onRetryPast.mock.calls[0]?.[1] as { nextDelayMs: number }).nextDelayMs).toBe(0);

        const futureDate = new Date(Date.now() + 5_000).toUTCString();
        mocks.request.mockRejectedValueOnce(apiError(429, { "retry-after": futureDate }));
        const onRetryFuture = vi.fn();

        configureRequestOptions({ retry: true, onRetry: onRetryFuture });

        const futurePromise = callSendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        });
        futurePromise.catch(() => {});
        await vi.advanceTimersByTimeAsync(5_000);
        await expect(futurePromise).resolves.toEqual({ id: 1 });
        const futureDelay = (onRetryFuture.mock.calls[0]?.[1] as { nextDelayMs: number })
            .nextDelayMs;
        expect(futureDelay).toBeGreaterThan(0);
        expect(futureDelay).toBeLessThanOrEqual(5_000);
    });

    test("rejects with ABORTED and stops retrying when the signal fires during backoff", async () => {
        const controller = new AbortController();
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({
            signal: controller.signal,
            retry: { maxRetries: 5, baseDelayMs: 1_000, maxDelayMs: 1_000 },
        });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(0); // first attempt fails, backoff scheduled
        controller.abort();
        await vi.advanceTimersByTimeAsync(10_000);

        await expect(promise).rejects.toMatchObject({ code: "ABORTED_ERROR" });
        expect(mocks.request).toHaveBeenCalledTimes(1); // no further attempt after abort
    });

    test("waits the server-dictated two seconds instead of exponential backoff", async () => {
        mocks.request.mockRejectedValueOnce(apiError(429, { "retry-after": "2" }));
        const onRetry = vi.fn();

        configureRequestOptions({
            retry: { maxRetries: 3, baseDelayMs: 250, maxDelayMs: 5_000 },
            onRetry,
        });

        const promise = callSendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(1_999);
        expect(mocks.request).toHaveBeenCalledTimes(1); // still waiting

        await vi.advanceTimersByTimeAsync(1);
        await expect(promise).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
        expect((onRetry.mock.calls[0]?.[1] as { nextDelayMs: number }).nextDelayMs).toBe(2_000);
    });
});

describe("requestId correlation", () => {
    const url = "https://graphql.anilist.co";

    test("stamps the thrown error with the same requestId as the lifecycle hooks", async () => {
        mocks.request.mockRejectedValue(apiError(500));
        let capturedRequestId: string | undefined;
        configureRequestOptions({
            retry: false,
            onRequestStart: (context) => {
                capturedRequestId = context.requestId;
            },
        });

        const error = await callSendRequest(url, "POST", { query: "query" }).catch((e) => e);

        expect(error).toBeInstanceOf(AniLinkApiError);
        expect(capturedRequestId).toEqual(expect.any(String));
        expect((error as AniLinkApiError).requestId).toBe(capturedRequestId);
    });

    test("stamps the circuit-open fast-fail error with a requestId", async () => {
        mocks.request.mockRejectedValue(apiError(500));
        const breaker = { threshold: 1, cooldownMs: 1_000 };
        let capturedRequestId: string | undefined;
        configureRequestOptions({
            retry: false,
            circuitBreaker: breaker,
            onRequestStart: (context) => {
                capturedRequestId = context.requestId;
            },
        });

        // First request trips the breaker (threshold 1).
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );

        // Second request fast-fails with CIRCUIT_OPEN_ERROR; it still gets a
        // requestId stamped so it can be correlated to its own hook stream.
        capturedRequestId = undefined;
        const error = await callSendRequest(url, "POST", { query: "query" }).catch((e) => e);

        expect(error).toBeInstanceOf(AniLinkNetworkError);
        expect((error as AniLinkNetworkError).code).toBe("CIRCUIT_OPEN_ERROR");
        expect(capturedRequestId).toEqual(expect.any(String));
        expect((error as AniLinkNetworkError).requestId).toBe(capturedRequestId);
    });
});

describe("contentType error propagation", () => {
    const url = "https://api.myanimelist.net/v2/anime";

    test("propagates the response Content-Type onto AniLinkApiError", async () => {
        mocks.request.mockRejectedValueOnce(apiError(429, { "content-type": "text/html" }));

        configureRequestOptions({ retry: false });

        const error = await callSendRequest(url, "GET").catch((e) => e);

        expect(error).toBeInstanceOf(AniLinkApiError);
        expect((error as AniLinkApiError).contentType).toBe("text/html");
    });

    test("propagates a capitalized Content-Type header", async () => {
        mocks.request.mockRejectedValueOnce(apiError(429, { "Content-Type": "application/json" }));

        configureRequestOptions({ retry: false });

        const error = await callSendRequest(url, "GET").catch((e) => e);

        expect(error).toBeInstanceOf(AniLinkApiError);
        expect((error as AniLinkApiError).contentType).toBe("application/json");
    });

    test("leaves contentType undefined when the response has no Content-Type", async () => {
        mocks.request.mockRejectedValueOnce(apiError(500, {}));

        configureRequestOptions({ retry: false });

        const error = await callSendRequest(url, "GET").catch((e) => e);

        expect(error).toBeInstanceOf(AniLinkApiError);
        expect((error as AniLinkApiError).contentType).toBeUndefined();
    });
});

describe("retry matrix per error class", () => {
    const url = "https://graphql.anilist.co";

    test("does not retry a GraphQL error with no upstream status (envelope 200)", async () => {
        // A 200 envelope carrying a GraphQL error with no `status` field is a
        // permanent query/validation failure, not a transient transport condition.
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "validation failed" }] },
        });

        configureRequestOptions({ retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 } });

        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkGraphQLError
        );
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("retries a GraphQL error whose upstream status is 429", async () => {
        mocks.request
            .mockResolvedValueOnce({
                data: { errors: [{ message: "rate limited", status: 429 }] },
            })
            .mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });

        configureRequestOptions({ retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 } });

        const promise = callSendRequest(url, "POST", { query: "query" });
        await vi.advanceTimersByTimeAsync(10);
        await expect(promise).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("does not retry an AniLinkAuthError", async () => {
        // An auth error is thrown pre-request when requiresAuth is set and no
        // token is supplied; it must never reach the retry loop.
        configureRequestOptions({ retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 } });

        await expect(
            sendRequest(url, "POST", { query: "query" }, undefined, {
                requiresAuth: true,
                options: pendingOptions,
            })
        ).rejects.toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });
});

describe("circuit breaker", () => {
    const breaker = { threshold: 2, cooldownMs: 1_000 };
    const url = "https://graphql.anilist.co";

    test("stays off when not configured so every request reaches the network", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({ retry: false });

        for (let index = 0; index < 5; index += 1) {
            await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
                AniLinkApiError
            );
        }
        expect(mocks.request).toHaveBeenCalledTimes(5);
    });

    test("throws a normalized AniLinkValidationError for an unparseable URL instead of sharing a fallback breaker scope", async () => {
        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        // An unparseable URL fails fast at dispatch instead of silently sharing
        // one breaker bucket with all other malformed-URL traffic, which
        // would let cross-endpoint failures contaminate each other. The error
        // is a normalized AniLinkValidationError (an AniLinkError subclass) so
        // consumers catching AniLinkError still handle it.
        await expect(
            callSendRequest("not a valid URL", "POST", { query: "query" })
        ).rejects.toBeInstanceOf(AniLinkValidationError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("opens after the failure budget and fast-fails with CIRCUIT_OPEN_ERROR", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        // Each failed request counts toward the consecutive-failure budget.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(2);

        // The breaker is open: requests fail fast without touching the network.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            name: "AniLinkNetworkError",
            code: "CIRCUIT_OPEN_ERROR",
        });
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "CIRCUIT_OPEN_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("lets a probe through after the cooldown and closes on success", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        expect(mocks.request).toHaveBeenCalledTimes(2);

        // Still inside the cooldown: fast-fail.
        await vi.advanceTimersByTimeAsync(999);
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "CIRCUIT_OPEN_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(2);

        // Cooldown elapsed: the next request probes the upstream and succeeds.
        await vi.advanceTimersByTimeAsync(1);
        mocks.request.mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });
        await expect(callSendRequest(url, "POST", { query: "query" })).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(3);

        // Success reset the streak, so a single new failure cannot re-open it.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(4);
    });

    test("re-opens immediately when the post-cooldown probe fails", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );

        await vi.advanceTimersByTimeAsync(breaker.cooldownMs);

        // The probe itself fails, which re-opens the breaker.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(3);

        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "CIRCUIT_OPEN_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(3);
    });

    test("reserves a single post-cooldown probe and fast-fails concurrent requests while it is pending", async () => {
        // After the cooldown elapses, the first request reserves the single
        // probe; concurrent requests while that probe is in flight must
        // fast-fail so only the probe reaches the upstream. Once the probe
        // settles, the breaker closes (success) or re-opens (failure).
        let resolveProbe: (value: { data: { data: { Media: { id: number } } } }) => void = () => {};
        const probeResponse = { data: { data: { Media: { id: 1 } } } };

        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        // Trip the breaker with two failures, then hold the probe pending.
        mocks.request
            .mockRejectedValueOnce(apiError(500))
            .mockRejectedValueOnce(apiError(500))
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveProbe = resolve;
                    })
            )
            .mockResolvedValue(probeResponse);

        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        expect(mocks.request).toHaveBeenCalledTimes(2);

        // Cooldown elapses; the next request reserves the probe and dispatches.
        await vi.advanceTimersByTimeAsync(breaker.cooldownMs);
        const probe = callSendRequest(url, "POST", { query: "query" });
        probe.catch(() => {});
        await vi.advanceTimersByTimeAsync(0); // let the probe dispatch
        expect(mocks.request).toHaveBeenCalledTimes(3);

        // While the probe is in flight, concurrent requests fast-fail without
        // reaching the network.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "CIRCUIT_OPEN_ERROR",
        });
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "CIRCUIT_OPEN_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(3);

        // The probe succeeds: the breaker closes and later requests dispatch.
        resolveProbe(probeResponse);
        await expect(probe).resolves.toEqual({ id: 1 });
        await expect(callSendRequest(url, "POST", { query: "query" })).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(4);
    });

    test("keeps breaker state scoped to each client's own options object", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        const clientAOptions = { retry: false as const, circuitBreaker: breaker };
        const clientBOptions = { retry: false as const, circuitBreaker: breaker };

        await expect(
            sendRequest(url, "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: clientAOptions,
            })
        ).rejects.toBeInstanceOf(AniLinkApiError);
        await expect(
            sendRequest(url, "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: clientAOptions,
            })
        ).rejects.toBeInstanceOf(AniLinkApiError);

        // Client A tripped its breaker...
        await expect(
            sendRequest(url, "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: clientAOptions,
            })
        ).rejects.toMatchObject({ code: "CIRCUIT_OPEN_ERROR" });
        // ...but client B still reaches the network.
        await expect(
            sendRequest(url, "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: clientBOptions,
            })
        ).rejects.toMatchObject({ code: "API_ERROR" });
        expect(mocks.request).toHaveBeenCalledTimes(3);
    });

    test("keeps breaker state scoped to each upstream host within one client", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        const options = { retry: false as const, circuitBreaker: breaker };
        const anilistUrl = "https://graphql.anilist.co";
        const malUrl = "https://api.myanimelist.net/v2/anime";

        // Trip the breaker against AniList.
        await expect(
            sendRequest(anilistUrl, "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: options,
            })
        ).rejects.toBeInstanceOf(AniLinkApiError);
        await expect(
            sendRequest(anilistUrl, "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: options,
            })
        ).rejects.toBeInstanceOf(AniLinkApiError);

        // AniList is now fast-failing...
        await expect(
            sendRequest(anilistUrl, "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: options,
            })
        ).rejects.toMatchObject({ code: "CIRCUIT_OPEN_ERROR" });
        // ...but a second provider on the same client still reaches its host.
        await expect(
            sendRequest(malUrl, "GET", undefined, undefined, {
                requiresAuth: false,
                options: options,
            })
        ).rejects.toMatchObject({ code: "API_ERROR" });
        expect(mocks.request).toHaveBeenCalledTimes(3);
    });

    test("fires onCircuitOpen once on trip with the host and failure count", async () => {
        mocks.request.mockRejectedValue(apiError(500));
        const onCircuitOpen = vi.fn();
        configureRequestOptions({
            retry: false,
            circuitBreaker: breaker,
            onCircuitOpen,
        });

        // Two failures reach the threshold and trip the breaker.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );

        // onCircuitOpen fires exactly once, with the host and the threshold
        // failure count.
        expect(onCircuitOpen).toHaveBeenCalledTimes(1);
        const context = onCircuitOpen.mock.calls[0][0];
        expect(context.host).toBe("graphql.anilist.co");
        expect(context.failures).toBe(breaker.threshold);
    });

    test("does not fire onCircuitOpen before the threshold is reached", async () => {
        mocks.request.mockRejectedValue(apiError(500));
        const onCircuitOpen = vi.fn();
        configureRequestOptions({
            retry: false,
            circuitBreaker: { threshold: 5, cooldownMs: 1_000 },
            onCircuitOpen,
        });

        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );

        expect(onCircuitOpen).not.toHaveBeenCalled();
    });

    test("does not fire onCircuitOpen on a re-open from a failed probe", async () => {
        mocks.request.mockRejectedValue(apiError(500));
        const onCircuitOpen = vi.fn();
        configureRequestOptions({
            retry: false,
            circuitBreaker: breaker,
            onCircuitOpen,
        });

        // Trip the breaker.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        expect(onCircuitOpen).toHaveBeenCalledTimes(1);

        // Cooldown elapses; the probe fails and re-opens the breaker.
        await vi.advanceTimersByTimeAsync(breaker.cooldownMs);
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );

        // A re-open from a failed probe is a continuation of the same open
        // period, so onCircuitOpen must not fire again.
        expect(onCircuitOpen).toHaveBeenCalledTimes(1);
    });

    test("fires onCircuitClose when the post-cooldown probe succeeds", async () => {
        mocks.request.mockRejectedValue(apiError(500));
        const onCircuitClose = vi.fn();
        configureRequestOptions({
            retry: false,
            circuitBreaker: breaker,
            onCircuitClose,
        });

        // Trip the breaker.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );

        // Cooldown elapses; the probe succeeds and closes the breaker.
        await vi.advanceTimersByTimeAsync(breaker.cooldownMs);
        mocks.request.mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });
        await expect(callSendRequest(url, "POST", { query: "query" })).resolves.toEqual({ id: 1 });

        expect(onCircuitClose).toHaveBeenCalledTimes(1);
        expect(onCircuitClose.mock.calls[0][0].host).toBe("graphql.anilist.co");
    });

    test("does not count a 404 toward the failure streak", async () => {
        mocks.request.mockRejectedValue(apiError(404));
        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        for (let index = 0; index < 3; index += 1) {
            await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
                code: "API_ERROR",
            });
        }
        // Three caller-side 404s never tripped the breaker: every request
        // reached the network.
        expect(mocks.request).toHaveBeenCalledTimes(3);
    });

    test("does not count caller-initiated aborts toward the failure streak", async () => {
        mocks.request.mockRejectedValue(makeAxiosCancelError());
        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        for (let index = 0; index < 3; index += 1) {
            await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
                code: "ABORTED_ERROR",
            });
        }
        expect(mocks.request).toHaveBeenCalledTimes(3);
    });

    test("does not count a GraphQL validation error (envelope 200) toward the failure streak", async () => {
        mocks.request.mockResolvedValue({ data: { errors: [{ message: "validation failed" }] } });
        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        for (let index = 0; index < 3; index += 1) {
            await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toBeInstanceOf(
                AniLinkGraphQLError
            );
        }
        expect(mocks.request).toHaveBeenCalledTimes(3);
    });

    test("closes the breaker when the post-cooldown probe fails with a caller-side 404", async () => {
        const onCircuitClose = vi.fn();
        mocks.request.mockRejectedValue(apiError(500));
        configureRequestOptions({
            retry: false,
            circuitBreaker: breaker,
            onCircuitClose,
        });

        // Trip the breaker with server faults.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(2);

        // Cooldown elapses; the probe answers 404 — the upstream is
        // reachable, so the breaker closes instead of re-opening.
        await vi.advanceTimersByTimeAsync(breaker.cooldownMs);
        mocks.request.mockRejectedValueOnce(apiError(404));
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(3);

        // The close is observable: onCircuitClose fires for the probe-close
        // path exactly like a successful probe.
        expect(onCircuitClose).toHaveBeenCalledTimes(1);
        expect(onCircuitClose.mock.calls[0][0].host).toBe("graphql.anilist.co");

        // Breaker closed: the next request reaches the network.
        mocks.request.mockRejectedValueOnce(apiError(404));
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(4);
    });

    test("opens after the failure budget of network errors", async () => {
        mocks.request.mockRejectedValue({
            isAxiosError: true,
            code: "ERR_NETWORK",
            message: "socket hang up",
        });
        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "NETWORK_ERROR",
        });
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "NETWORK_ERROR",
        });

        // Two network errors reached the threshold: fast-fail next.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "CIRCUIT_OPEN_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("opens after the failure budget of 429 responses", async () => {
        mocks.request.mockRejectedValue(apiError(429));
        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });

        // Two rate-limit responses reached the threshold: fast-fail next.
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "CIRCUIT_OPEN_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("resets the failure streak when a caller-side error proves the upstream reachable", async () => {
        // A 404 is evidence the upstream answers. Interleaving 404s between
        // 500s must reset the availability-failure streak, so a later
        // isolated 500 cannot trip the breaker on a stale streak.
        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        mocks.request.mockRejectedValueOnce(apiError(500));
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });

        // A caller-side 404 proves reachability and resets the streak.
        mocks.request.mockRejectedValueOnce(apiError(404));
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });

        // One isolated 500 after the reset: below the threshold of 2, so
        // the next request still reaches the network instead of
        // fast-failing on a stale streak.
        mocks.request.mockRejectedValueOnce(apiError(500));
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        mocks.request.mockRejectedValueOnce(apiError(500));
        await expect(callSendRequest(url, "POST", { query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(4);
    });

    test("closes the breaker when the caller aborts while the probe waits on a pace deadline", async () => {
        // A caller abort carries no upstream-health signal. When the
        // reserved half-open probe is aborted during the pre-dispatch
        // pacing wait, the breaker must close — matching the axios-cancel
        // path, where the same abort also closes it — instead of re-opening
        // with a fresh cooldown.
        const controller = new AbortController();
        configureRequestOptions({
            retry: false,
            circuitBreaker: breaker,
            paceWithRateLimit: true,
            signal: controller.signal,
        });

        // A successful paced response records the shared 60s reset deadline
        // for the host (failures never record pace deadlines) and enters its
        // own post-success pace wait. The call stays in flight: its recorded
        // deadline is what gates the probe below.
        mocks.request.mockResolvedValueOnce({
            data: { data: { Media: { id: 1 } } },
            headers: {
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "0",
                "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
            },
        });
        const paced = callSendRequest(url, "POST", { query: "query" });
        paced.catch(() => {});
        await vi.advanceTimersByTimeAsync(0); // response settles into its pace wait

        // Trip the breaker with two server faults. These calls bypass the
        // recorded pace deadline (they must fail fast, not wait out the
        // window) but share the same stateOwner so they trip the same
        // breaker the probe will probe.
        const bypassSendRequest = (data?: object) =>
            sendRequest(url, "POST", data, undefined, {
                requiresAuth: false,
                options: { ...pendingOptions, ignorePaceDeadline: true },
                stateOwner: pendingOptions,
            });
        mocks.request.mockRejectedValueOnce(apiError(500));
        await expect(bypassSendRequest({ query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        mocks.request.mockRejectedValueOnce(apiError(500));
        await expect(bypassSendRequest({ query: "query" })).rejects.toMatchObject({
            code: "API_ERROR",
        });
        expect(mocks.request).toHaveBeenCalledTimes(3);

        // Cooldown elapses; the next request reserves the probe and enters
        // the pre-dispatch pacing wait for the recorded deadline.
        await vi.advanceTimersByTimeAsync(breaker.cooldownMs);
        const probe = callSendRequest(url, "POST", { query: "query" });
        probe.catch(() => {});
        await vi.advanceTimersByTimeAsync(1);
        // The probe has not reached the network: it is waiting on the pace
        // deadline.
        expect(mocks.request).toHaveBeenCalledTimes(3);

        // The caller aborts during the pacing wait. Both the probe's
        // pre-dispatch wait and the paced call's post-success wait reject.
        controller.abort();
        await expect(probe).rejects.toMatchObject({ code: "ABORTED_ERROR" });
        await expect(paced).rejects.toMatchObject({ code: "ABORTED_ERROR" });

        // The breaker must be closed (not re-opened): the next request
        // reaches the network instead of fast-failing with CIRCUIT_OPEN_ERROR.
        // The verification call needs a fresh signal (the test's controller
        // is spent) and bypasses the still-recorded pace deadline (the test
        // never advances past it after the abort).
        mocks.request.mockRejectedValueOnce(apiError(500));
        const verifyOptions = {
            ...pendingOptions,
            signal: undefined,
            ignorePaceDeadline: true,
        } as RequestOptions;
        await expect(
            sendRequest(url, "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: verifyOptions,
                stateOwner: pendingOptions,
            })
        ).rejects.toMatchObject({ code: "API_ERROR" });
        expect(mocks.request).toHaveBeenCalledTimes(4);
    });
});

describe("rate-limit pacing", () => {
    const url = "https://graphql.anilist.co";
    const pacedResponse = (remaining: number, secondsUntilReset: number): object => ({
        data: { data: { Media: { id: 1 } } },
        headers: {
            "x-ratelimit-limit": "90",
            "x-ratelimit-remaining": String(remaining),
            "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + secondsUntilReset),
        },
    });

    test("is inactive when explicitly disabled even when the reported quota is exhausted", async () => {
        mocks.request.mockResolvedValue(pacedResponse(0, 60));

        configureRequestOptions({ paceWithRateLimit: false });

        await callSendRequest(url, "POST", { query: "query" });
        await callSendRequest(url, "POST", { query: "query" });

        expect(mocks.request).toHaveBeenCalledTimes(2);
        expect(Date.now() - startedAt).toBeLessThan(1_000);
    });

    test("paces by default once the reported quota is exhausted", async () => {
        mocks.request.mockResolvedValue(pacedResponse(0, 5));

        configureRequestOptions({});

        const first = callSendRequest(url, "POST", { query: "query" });
        first.catch(() => {});
        await vi.advanceTimersByTimeAsync(4_999);
        expect(mocks.request).toHaveBeenCalledTimes(1); // still waiting for the reset

        await vi.advanceTimersByTimeAsync(1);
        await expect(first).resolves.toEqual({ id: 1 });
    });

    test("delays the next request until the window resets once remaining drops below the floor", async () => {
        mocks.request.mockResolvedValue(pacedResponse(0, 5));

        configureRequestOptions({ paceWithRateLimit: true });

        // The first response already reports an exhausted quota, so even this
        // first caller waits for the reset before its result settles.
        const first = callSendRequest(url, "POST", { query: "query" });
        first.catch(() => {});
        await vi.advanceTimersByTimeAsync(4_999);
        expect(mocks.request).toHaveBeenCalledTimes(1); // still waiting for the reset

        await vi.advanceTimersByTimeAsync(1);
        await expect(first).resolves.toEqual({ id: 1 });

        // The next request is paced again by the refreshed headers.
        const second = callSendRequest(url, "POST", { query: "query" });
        second.catch(() => {});
        await vi.advanceTimersByTimeAsync(5_000);
        await expect(second).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("does not pace while remaining quota stays at or above the floor", async () => {
        mocks.request.mockResolvedValue(pacedResponse(30, 60));

        configureRequestOptions({ paceWithRateLimit: true });

        await callSendRequest(url, "POST", { query: "query" });
        await callSendRequest(url, "POST", { query: "query" });

        expect(mocks.request).toHaveBeenCalledTimes(2);
        expect(Date.now() - startedAt).toBeLessThan(1_000);
    });

    test("paces when remaining quota drops below a raised rateLimitFloor", async () => {
        mocks.request.mockResolvedValue(pacedResponse(3, 4));

        configureRequestOptions({ paceWithRateLimit: true, rateLimitFloor: 5 });

        const first = callSendRequest(url, "POST", { query: "query" });
        first.catch(() => {});
        await vi.advanceTimersByTimeAsync(4_000);
        await expect(first).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(1);

        const promise = callSendRequest(url, "POST", { query: "query" });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(4_000);
        await expect(promise).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("propagates an abort during the pacing wait without re-reporting the finished attempt", async () => {
        const controller = new AbortController();
        const onResponse = vi.fn();
        mocks.request.mockResolvedValue(pacedResponse(0, 60));

        configureRequestOptions({
            paceWithRateLimit: true,
            signal: controller.signal,
            onResponse,
        });

        const promise = callSendRequest(url, "POST", { query: "query" });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(0); // attempt done, pacing wait scheduled
        expect(onResponse).toHaveBeenCalledTimes(1);
        controller.abort();
        await vi.advanceTimersByTimeAsync(60_000);

        await expect(promise).rejects.toMatchObject({ code: "ABORTED_ERROR" });
        // The successful attempt is reported exactly once; the pacing abort is
        // not mistaken for a second attempt outcome.
        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("gates an independently dispatched request on the shared reset deadline", async () => {
        // The first response reports an exhausted quota with a reset 60s out,
        // recording that deadline and pacing its own response until it. A
        // second, independently dispatched call to the same host must wait for
        // the shared recorded deadline before it is sent; once it dispatches
        // it gets a healthy response and resolves immediately.
        mocks.request
            .mockResolvedValueOnce({
                data: { data: { Media: { id: 1 } } },
                headers: {
                    "x-ratelimit-limit": "90",
                    "x-ratelimit-remaining": "0",
                    "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
                },
            })
            .mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });

        configureRequestOptions({ paceWithRateLimit: true });

        // First call: dispatches immediately, then records the 60s deadline
        // and paces its own response until it.
        const first = callSendRequest(url, "POST", { query: "query" });
        first.catch(() => {});
        // Advance 1ms to flush the first response microtask so it records the
        // shared deadline; the first call remains in its post-success pace
        // wait (60s out).
        await vi.advanceTimersByTimeAsync(1);
        expect(mocks.request).toHaveBeenCalledTimes(1);

        // Second independent call: must wait for the recorded deadline before
        // reaching the network. It must stay gated well into the 60s window.
        const second = callSendRequest(url, "POST", { query: "query" });
        second.catch(() => {});
        await vi.advanceTimersByTimeAsync(30_000);
        expect(mocks.request).toHaveBeenCalledTimes(1); // second still gated

        // Advancing past the 60s deadline releases both the first call's
        // pace wait and the second call's pre-dispatch wait; the second then
        // dispatches and resolves on its healthy response.
        await vi.advanceTimersByTimeAsync(35_000);
        await expect(first).resolves.toEqual({ id: 1 });
        await expect(second).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("ignorePaceDeadline bypasses a recorded rate-limit deadline", async () => {
        mocks.request
            .mockResolvedValueOnce({
                data: { data: { Media: { id: 1 } } },
                headers: {
                    "x-ratelimit-limit": "90",
                    "x-ratelimit-remaining": "0",
                    "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
                },
            })
            .mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });

        configureRequestOptions({ paceWithRateLimit: true });

        // First call: dispatches immediately, then records the 60s deadline.
        const first = callSendRequest(url, "POST", { query: "query" });
        first.catch(() => {});
        await vi.advanceTimersByTimeAsync(1);
        expect(mocks.request).toHaveBeenCalledTimes(1);

        // Second call with ignorePaceDeadline bypasses the recorded deadline
        // and dispatches immediately, well inside the 60s window.
        const second = sendRequest(url, "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: { ...pendingOptions, ignorePaceDeadline: true },
        });
        second.catch(() => {});
        await vi.advanceTimersByTimeAsync(1);
        expect(mocks.request).toHaveBeenCalledTimes(2);
        await expect(second).resolves.toEqual({ id: 1 });
    });
});

describe("computeNextRetryDelay", () => {
    const policy = {
        maxRetries: 3,
        baseDelayMs: 1,
        maxDelayMs: 1,
        retryOnStatus: [429, 500, 502, 503, 504],
        retryOnNetworkError: true,
        jitter: false,
    };
    const failure = new AniLinkApiError(500, {});
    const budget = { maxRetriesPerWindow: 3, windowMs: 60_000 };

    test("returns null for a failed half-open probe", () => {
        expect(
            computeNextRetryDelay({
                normalized: failure,
                rawError: failure,
                attempt: 0,
                policy,
                budgetState: undefined,
                budget: undefined,
                wasProbe: true,
            })
        ).toBeNull();
    });

    test("returns null when retries are disabled", () => {
        expect(
            computeNextRetryDelay({
                normalized: failure,
                rawError: failure,
                attempt: 0,
                policy: null,
                budgetState: undefined,
                budget: undefined,
                wasProbe: false,
            })
        ).toBeNull();
    });

    test("returns null when the retry budget is exhausted", () => {
        expect(
            computeNextRetryDelay({
                normalized: failure,
                rawError: failure,
                attempt: 0,
                policy,
                budgetState: { retriesUsed: 3, windowEndsAt: Date.now() + 1_000 },
                budget,
                wasProbe: false,
            })
        ).toBeNull();
    });

    test("defers to getRetryDelay when the budget has room", () => {
        expect(
            computeNextRetryDelay({
                normalized: failure,
                rawError: failure,
                attempt: 0,
                policy,
                budgetState: { retriesUsed: 0, windowEndsAt: Date.now() + 1_000 },
                budget,
                wasProbe: false,
            })
        ).toBe(1);
    });

    test("defers to getRetryDelay when no budget is configured", () => {
        expect(
            computeNextRetryDelay({
                normalized: failure,
                rawError: failure,
                attempt: 0,
                policy,
                budgetState: undefined,
                budget: undefined,
                wasProbe: false,
            })
        ).toBe(1);
    });

    test("defers to getRetryDelay when only the budget state is present", () => {
        // A live window without a configured budget cannot gate retries:
        // both halves of the guard must be present.
        expect(
            computeNextRetryDelay({
                normalized: failure,
                rawError: failure,
                attempt: 0,
                policy,
                budgetState: { retriesUsed: 3, windowEndsAt: Date.now() + 1_000 },
                budget: undefined,
                wasProbe: false,
            })
        ).toBe(1);
    });

    test("defers to getRetryDelay when only the budget configuration is present", () => {
        expect(
            computeNextRetryDelay({
                normalized: failure,
                rawError: failure,
                attempt: 0,
                policy,
                budgetState: undefined,
                budget,
                wasProbe: false,
            })
        ).toBe(1);
    });
});
