import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AniLinkApiError, AniLinkNetworkError } from "../src/base/AniLinkError";
import { type RequestOptions, sendRequest } from "../src/base/RequestHandler";
import { getAxiosStub, makeAxiosResponseError as apiError } from "./helpers/axiosStub";

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
    sendRequest(url, method, data, undefined, false, pendingOptions);

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
            retry: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 10 },
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
        expect(firstContext?.nextDelayMs).toBeDefined();
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
            "[AniLink] onRetry hook threw and was ignored:",
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
        await expect(promise).resolves.toBeDefined();

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
        await expect(promise).resolves.toBeDefined();

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
        await expect(pastPromise).resolves.toBeDefined();
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
        await expect(futurePromise).resolves.toBeDefined();
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
        await expect(promise).resolves.toBeDefined();
        expect(mocks.request).toHaveBeenCalledTimes(2);
        expect((onRetry.mock.calls[0]?.[1] as { nextDelayMs: number }).nextDelayMs).toBe(2_000);
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

    test("uses a shared fallback scope when the circuit URL is invalid", async () => {
        configureRequestOptions({ retry: false, circuitBreaker: breaker });

        await expect(
            callSendRequest("not a valid URL", "POST", { query: "query" })
        ).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(1);
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

    test("keeps breaker state scoped to each client's own options object", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        const clientAOptions = { retry: false as const, circuitBreaker: breaker };
        const clientBOptions = { retry: false as const, circuitBreaker: breaker };

        await expect(
            sendRequest(url, "POST", { query: "query" }, undefined, false, clientAOptions)
        ).rejects.toBeInstanceOf(AniLinkApiError);
        await expect(
            sendRequest(url, "POST", { query: "query" }, undefined, false, clientAOptions)
        ).rejects.toBeInstanceOf(AniLinkApiError);

        // Client A tripped its breaker...
        await expect(
            sendRequest(url, "POST", { query: "query" }, undefined, false, clientAOptions)
        ).rejects.toMatchObject({ code: "CIRCUIT_OPEN_ERROR" });
        // ...but client B still reaches the network.
        await expect(
            sendRequest(url, "POST", { query: "query" }, undefined, false, clientBOptions)
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
            sendRequest(anilistUrl, "POST", { query: "query" }, undefined, false, options)
        ).rejects.toBeInstanceOf(AniLinkApiError);
        await expect(
            sendRequest(anilistUrl, "POST", { query: "query" }, undefined, false, options)
        ).rejects.toBeInstanceOf(AniLinkApiError);

        // AniList is now fast-failing...
        await expect(
            sendRequest(anilistUrl, "POST", { query: "query" }, undefined, false, options)
        ).rejects.toMatchObject({ code: "CIRCUIT_OPEN_ERROR" });
        // ...but a second provider on the same client still reaches its host.
        await expect(
            sendRequest(malUrl, "GET", undefined, undefined, false, options)
        ).rejects.toMatchObject({ code: "API_ERROR" });
        expect(mocks.request).toHaveBeenCalledTimes(3);
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

    test("is inactive by default even when the reported quota is exhausted", async () => {
        mocks.request.mockResolvedValue(pacedResponse(0, 60));

        configureRequestOptions({});

        await callSendRequest(url, "POST", { query: "query" });
        await callSendRequest(url, "POST", { query: "query" });

        expect(mocks.request).toHaveBeenCalledTimes(2);
        expect(Date.now() - startedAt).toBeLessThan(1_000);
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
});
