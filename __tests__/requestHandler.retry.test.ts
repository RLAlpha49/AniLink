import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AniLinkApiError, AniLinkNetworkError } from "../src/base/AniLinkError";
import { configureRequestOptions, sendRequest } from "../src/base/RequestHandler";

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

const apiError = (status: number, headers: Record<string, string> = {}): object => ({
    isAxiosError: true,
    response: { status, data: { message: `status ${status}` }, headers },
});

beforeEach(() => {
    vi.clearAllMocks();
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

        const promise = sendRequest("https://graphql.anilist.co", "POST", {
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

        const promise = sendRequest("https://graphql.anilist.co", "POST", {
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

        const promise = sendRequest("https://graphql.anilist.co", "POST", {
            query: "query { Media(id: 3) { id } }",
        });

        await vi.advanceTimersByTimeAsync(10);
        await expect(promise).resolves.toEqual({ id: 3 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("gives up after maxRetries and throws the normalized error", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({ retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 1 } });

        const promise = sendRequest("https://graphql.anilist.co", "POST", {
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
            sendRequest("https://graphql.anilist.co", "POST", { query: "query" })
        ).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("does not retry by default (opt-in)", async () => {
        mocks.request.mockRejectedValue(apiError(500));

        configureRequestOptions({});

        await expect(
            sendRequest("https://graphql.anilist.co", "POST", { query: "query" })
        ).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("retries with the default policy when retry is true", async () => {
        mocks.request
            .mockRejectedValueOnce(apiError(500))
            .mockResolvedValueOnce({ data: { data: { Media: { id: 6 } } } });

        configureRequestOptions({ retry: true });

        const promise = sendRequest("https://graphql.anilist.co", "POST", {
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
            sendRequest("https://graphql.anilist.co", "POST", { query: "query" })
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
            sendRequest("https://graphql.anilist.co", "POST", { query: "query" })
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

        const promise = sendRequest("https://graphql.anilist.co", "POST", {
            query: "query { Media(id: 5) { id } }",
        });
        promise.catch(() => {});

        await vi.advanceTimersByTimeAsync(100);
        await expect(promise).rejects.toBeInstanceOf(AniLinkApiError);

        expect(onError).toHaveBeenCalledTimes(1);
        const [error, context] = onError.mock.calls[0] as [
            AniLinkApiError,
            { url: string; method: string; attempt: number },
        ];
        expect(error).toBeInstanceOf(AniLinkApiError);
        expect(context).toEqual({
            url: "https://graphql.anilist.co",
            method: "POST",
            attempt: 2,
        });
    });
});
