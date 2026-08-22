import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AniLinkApiError, AniLinkNetworkError } from "../src/base/AniLinkError";
import { type RequestOptions, sendRequest } from "../src/base/RequestHandler";

const mocks = vi.hoisted(() => {
    const request = vi.fn(async () => ({ data: { data: { Media: { id: 1 } } } }));
    const create = vi.fn(() => request);
    const isAxiosError = vi.fn((error: unknown) =>
        Boolean((error as { isAxiosError?: boolean })?.isAxiosError)
    );
    const isCancel = vi.fn((error: unknown) =>
        Boolean((error as { isCanceled?: boolean })?.isCanceled)
    );

    return { request, create, isAxiosError, isCancel };
});

vi.mock("axios", () => ({
    default: Object.assign(vi.fn(), {
        create: mocks.create,
        isAxiosError: mocks.isAxiosError,
        isCancel: mocks.isCancel,
    }),
}));

// Transport settings are passed per request since the global
// `configureRequestOptions` setter was removed.
let pendingOptions: RequestOptions | undefined;
const configureRequestOptions = (options: RequestOptions): void => {
    pendingOptions = options;
};
const callSendRequest = (url: string, method: "GET" | "POST", data?: object): Promise<unknown> =>
    sendRequest(url, method, data, undefined, false, pendingOptions);

const apiError = (status: number, headers: Record<string, string> = {}): object => ({
    isAxiosError: true,
    response: { status, data: { message: `status ${status}` }, headers },
});

beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockImplementation(async () => ({ data: { data: { Media: { id: 1 } } } }));
    vi.useFakeTimers();
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

    test("does not retry by default (opt-in)", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({});

        await expect(
            callSendRequest("https://graphql.anilist.co", "POST", { query: "query" })
        ).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
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
