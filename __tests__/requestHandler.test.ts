import axios from "axios";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkGraphQLError,
    AniLinkNetworkError,
} from "../src/base/AniLinkError";
import {
    DEFAULT_REQUEST_TIMEOUT,
    sendRequest,
    unwrapGraphQLResponse,
    unwrapSingleRootField,
} from "../src/base/RequestHandler";
import { AniLink } from "../src/AniLink";

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

beforeEach(() => {
    vi.clearAllMocks();
});

test("uses the default timeout with the shared Axios instance", async () => {
    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" });

    expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: DEFAULT_REQUEST_TIMEOUT })
    );
});

test("forwards a configured timeout to Axios", async () => {
    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, false, {
        timeout: 5_000,
    });

    expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 5_000 }));
});

test("forwards an AbortSignal to Axios", async () => {
    const controller = new AbortController();

    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, false, {
        signal: controller.signal,
    });

    expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal })
    );
});

test.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid timeout %s",
    async (timeout) => {
        await expect(
            sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "query" },
                undefined,
                false,
                {
                    timeout,
                }
            )
        ).rejects.toThrow(TypeError);
    }
);

test("allows zero to disable the Axios timeout", async () => {
    await expect(
        sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, false, {
            timeout: 0,
        })
    ).resolves.toBeDefined();
});

test("throws AniLinkAuthError when a token is required but missing", async () => {
    const error = await sendRequest(
        "https://graphql.anilist.co",
        "POST",
        {},
        undefined,
        true
    ).catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(AniLinkAuthError);
    expect(error).toMatchObject({ name: "AniLinkAuthError", code: "AUTH_ERROR" });
    expect(mocks.request).not.toHaveBeenCalled();
});

test("throws AniLinkAuthError for an empty-string token when auth is required", async () => {
    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, "", true).catch(
        (requestError: unknown) => requestError
    );

    expect(error).toBeInstanceOf(AniLinkAuthError);
    expect(error).toMatchObject({ name: "AniLinkAuthError", code: "AUTH_ERROR" });
    expect(mocks.request).not.toHaveBeenCalled();
});

test("does not require a token when requiresAuth is false", async () => {
    await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, false);

    expect(mocks.request).toHaveBeenCalledTimes(1);
});

test("normalizes an HTTP failure without exposing the Axios response", async () => {
    mocks.request.mockRejectedValueOnce({
        isAxiosError: true,
        code: "ERR_BAD_RESPONSE",
        response: {
            status: 429,
            statusText: "Too Many Requests",
            data: { message: "secret-token was echoed by the upstream service" },
        },
        request: { headers: { Authorization: "Bearer secret-token" } },
    });

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
        (requestError: unknown) => requestError
    );

    expect(error).toBeInstanceOf(AniLinkApiError);
    expect(error).toMatchObject({ name: "AniLinkApiError", code: "API_ERROR", status: 429 });
    expect(error).toHaveProperty("data");
    expect(error).not.toHaveProperty("response");
    expect(error).not.toHaveProperty("request");
});

test("preserves the upstream API error body without exposing Axios internals", async () => {
    const responseData = {
        errors: [{ message: "Field `media` requires a type." }],
    };

    mocks.request.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
            status: 400,
            data: responseData,
        },
        request: { headers: { Authorization: "Bearer secret-token" } },
    });

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
        (requestError: unknown) => requestError
    );

    expect(error).toBeInstanceOf(AniLinkApiError);
    expect(error).toMatchObject({ status: 400, data: responseData });
    expect(error).not.toHaveProperty("response");
    expect(error).not.toHaveProperty("request");
    expect(error).not.toHaveProperty("headers");
});

test("does not expose the raw Axios error by default", async () => {
    const axiosError = {
        isAxiosError: true,
        response: { status: 500, data: { message: "server error" } },
        request: { headers: { Authorization: "Bearer secret-token" } },
    };
    mocks.request.mockRejectedValueOnce(axiosError);

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
        (requestError: unknown) => requestError
    );

    expect(error).toBeInstanceOf(AniLinkApiError);
    expect(error).not.toHaveProperty("rawAxiosError");
});

test("exposes the original Axios error when explicitly enabled", async () => {
    const axiosError = {
        isAxiosError: true,
        response: { status: 500, data: { message: "server error" } },
        request: { headers: { Authorization: "Bearer secret-token" } },
    };
    mocks.request.mockRejectedValueOnce(axiosError);

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, false, {
        exposeRawAxiosError: true,
    }).catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(AniLinkApiError);
    expect((error as AniLinkApiError).rawAxiosError).toBe(axiosError);
});

test("normalizes a network failure with a stable code", async () => {
    mocks.request.mockRejectedValueOnce({
        isAxiosError: true,
        code: "ERR_NETWORK",
        message: "network failed while handling secret-token",
        request: { headers: { Authorization: "Bearer secret-token" } },
    });

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
        (requestError: unknown) => requestError
    );

    expect(error).toBeInstanceOf(AniLinkNetworkError);
    expect(error).toMatchObject({ name: "AniLinkNetworkError", code: "NETWORK_ERROR" });
    expect((error as Error).message).toBe("AniList request failed due to a network error.");
    expect((error as Error).message).not.toContain("secret-token");
});

test("classifies Axios timeout failures separately from other network failures", async () => {
    mocks.request.mockRejectedValueOnce({
        isAxiosError: true,
        code: "ETIMEDOUT",
        message: "timeout for secret-token",
    });

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
        (requestError: unknown) => requestError
    );

    expect(error).toBeInstanceOf(AniLinkNetworkError);
    expect(error).toMatchObject({ name: "AniLinkNetworkError", code: "TIMEOUT_ERROR" });
    expect((error as Error).message).toBe("AniList request timed out.");
});

test("classifies Axios cancellation failures separately from timeouts", async () => {
    mocks.request.mockRejectedValueOnce({
        isAxiosError: true,
        isCanceled: true,
        code: "ERR_CANCELED",
        message: "cancelled secret-token request",
    });

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
        (requestError: unknown) => requestError
    );

    expect(error).toBeInstanceOf(AniLinkNetworkError);
    expect(error).toMatchObject({ name: "AniLinkNetworkError", code: "ABORTED_ERROR" });
    expect((error as Error).message).toBe("AniList request was cancelled.");
});

test("normalizes unexpected transport failures without rethrowing raw values", async () => {
    mocks.request.mockRejectedValueOnce(new Error("secret-token leaked by adapter"));

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
        (requestError: unknown) => requestError
    );

    expect(error).toBeInstanceOf(AniLinkError);
    expect(error).toMatchObject({ name: "AniLinkError", code: "UNKNOWN_ERROR" });
    expect((error as Error).message).toBe("AniList request failed.");
    expect((error as Error).message).not.toContain("secret-token");
});

test("preserves the original throwable in UNKNOWN failures when exposeRawAxiosError is enabled", async () => {
    const original = new Error("secret-token leaked by adapter");
    mocks.request.mockRejectedValueOnce(original);

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, false, {
        exposeRawAxiosError: true,
    }).catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(AniLinkError);
    expect(error).toMatchObject({ name: "AniLinkError", code: "UNKNOWN_ERROR" });
    expect((error as AniLinkError).rawAxiosError).toBe(original);
    expect((error as Error).cause).toBe(original);
});

test("sends JSON content headers without an Authorization header when no token is given", async () => {
    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" });

    expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
    );
});

test("attaches a Bearer Authorization header when a token is given", async () => {
    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, "secret-token");

    expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: "Bearer secret-token",
            },
        })
    );
});

test("omits the Authorization header for an empty-string token when auth is not required", async () => {
    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, "", false);

    const call = mocks.request.mock.calls[0]?.[0] as { headers: Record<string, string> };
    expect(call.headers).not.toHaveProperty("Authorization");
    expect(call.headers).toMatchObject({
        "Content-Type": "application/json",
        Accept: "application/json",
    });
});

test("unwraps the single root field of the GraphQL data envelope", async () => {
    mocks.request.mockResolvedValueOnce({ data: { data: { Media: { id: 7, title: "Trigun" } } } });

    await expect(
        sendRequest("https://graphql.anilist.co", "POST", { query: "query" })
    ).resolves.toEqual({
        id: 7,
        title: "Trigun",
    });
});

test("passes through the full envelope when the response has multiple root fields", async () => {
    const envelope = { data: { Media: { id: 1 }, User: { id: 2 } } };
    mocks.request.mockResolvedValueOnce({ data: envelope });

    await expect(
        sendRequest("https://graphql.anilist.co", "POST", { query: "query" })
    ).resolves.toEqual(envelope);
});

test("unwrapSingleRootField returns the bare value for a single-root-field envelope", () => {
    const envelope = { data: { Media: { id: 7 } } };

    expect(unwrapSingleRootField<{ id: number }>(envelope)).toEqual({ id: 7 });
});

test("unwrapSingleRootField returns undefined for multi-root-field envelopes", () => {
    const envelope = { data: { Media: { id: 1 }, User: { id: 2 } } };

    expect(unwrapSingleRootField(envelope)).toBeUndefined();
});

test("unwrapSingleRootField returns undefined when data is missing or null", () => {
    expect(unwrapSingleRootField({ errors: [{ message: "boom" }] })).toBeUndefined();
    expect(unwrapSingleRootField({ data: null })).toBeUndefined();
    expect(unwrapSingleRootField(null)).toBeUndefined();
});

test("unwrapGraphQLResponse keeps the envelope for a zero-root-field document", async () => {
    const envelope = { data: {} };
    mocks.request.mockResolvedValueOnce({ data: envelope });

    await expect(
        sendRequest("https://graphql.anilist.co", "POST", { query: "query" })
    ).resolves.toEqual(envelope);
});

test("unwrapGraphQLResponse unwraps the single root field through the strict helper", () => {
    const envelope = { data: { Media: { id: 5 } } };

    expect(unwrapGraphQLResponse(envelope)).toEqual({ id: 5 });
});

test("throws AniLinkGraphQLError for a 200 envelope without a data object", async () => {
    const envelope = { errors: [{ message: "Not authenticated." }] };
    mocks.request.mockResolvedValueOnce({ data: envelope });

    const error = await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }).catch(
        (requestError: unknown) => requestError
    );

    expect(error).toBeInstanceOf(AniLinkGraphQLError);
    expect((error as AniLinkGraphQLError).graphqlErrors).toEqual(envelope.errors);
    expect((error as Error).message).toContain("Not authenticated.");
});

test("propagates the normalized error when the transport rejects", async () => {
    mocks.request.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404, data: { message: "not found" } },
    });

    await expect(
        sendRequest("https://graphql.anilist.co", "POST", { query: "query" })
    ).rejects.toMatchObject({ name: "AniLinkApiError", code: "API_ERROR", status: 404 });
});

describe("per-instance options isolation", () => {
    test("constructing a second client does not mutate the first client's effective timeout", async () => {
        const first = new AniLink(undefined, { timeout: 12_345 });
        new AniLink(undefined, { timeout: 5_000 });

        await first.anilist.query.media({ id: 1, type: "ANIME" });

        expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 12_345 }));
    });

    test("scopes instance options to their own client instead of the global defaults", async () => {
        new AniLink(undefined, { timeout: 7_777 });

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" });

        expect(mocks.request).toHaveBeenCalledWith(
            expect.objectContaining({ timeout: DEFAULT_REQUEST_TIMEOUT })
        );
    });

    test("forwards instance options through the operation wrapper into sendRequest", async () => {
        const client = new AniLink("token-a", { timeout: 4_000 });

        await client.anilist.query.media({ id: 1, type: "ANIME" });

        expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 4_000 }));
    });
});

describe("per-call options", () => {
    test("applies the same options to every request that passes them", async () => {
        const options = { timeout: 5_000 };

        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            false,
            options
        );
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            false,
            options
        );

        expect(mocks.request).toHaveBeenCalledTimes(2);
        const timeouts = mocks.request.mock.calls.map(
            (call) => (call[0] as { timeout: number }).timeout
        );
        expect(timeouts).toEqual([5_000, 5_000]);
    });

    test("falls back to library defaults when no options are passed", async () => {
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 500, data: {} },
        });
        await expect(sendRequest("https://graphql.anilist.co", "POST")).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        expect(mocks.request).toHaveBeenCalledTimes(1); // retry defaults to disabled

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" });
        expect(mocks.request).toHaveBeenLastCalledWith(
            expect.objectContaining({ timeout: DEFAULT_REQUEST_TIMEOUT })
        );
    });
});

describe("GraphQL errors in HTTP 200 responses", () => {
    test("throws AniLinkGraphQLError for a 200 envelope with errors and null data", async () => {
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "Not authenticated." }], data: null },
        });

        const error = await sendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        }).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
        expect(error).toMatchObject({
            name: "AniLinkGraphQLError",
            code: "GRAPHQL_ERROR",
            status: 200,
        });
        expect((error as AniLinkGraphQLError).graphqlErrors).toEqual([
            { message: "Not authenticated." },
        ]);
        expect((error as Error).message).toContain("Not authenticated.");
    });

    test("throws AniLinkGraphQLError preserving upstream messages when partial data is present", async () => {
        const partialData = { Media: { id: 1 } };
        mocks.request.mockResolvedValueOnce({
            data: {
                data: partialData,
                errors: [{ message: "first problem" }, { message: "second problem" }],
            },
        });

        const error = await sendRequest("https://graphql.anilist.co", "POST", {
            query: "query",
        }).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
        expect((error as AniLinkGraphQLError).status).toBe(200);
        expect((error as AniLinkGraphQLError).data).toEqual(partialData);
        expect((error as Error).message).toContain("first problem");
        expect((error as Error).message).toContain("second problem");
    });
});

describe("request lifecycle hooks", () => {
    test("invokes onRequestStart then onResponse with the attempt duration", async () => {
        const events: string[] = [];
        const onRequestStart = vi.fn(() => {
            events.push("start");
        });
        const onResponse = vi.fn(() => {
            events.push("response");
        });

        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            false,
            {
                onRequestStart,
                onResponse,
            }
        );

        expect(events).toEqual(["start", "response"]);
        expect(onRequestStart).toHaveBeenCalledWith({
            url: "https://graphql.anilist.co",
            method: "POST",
            attempt: 1,
        });
        expect(onResponse).toHaveBeenCalledTimes(1);
        const [responseContext] = onResponse.mock.calls[0] as [
            { url: string; method: string; attempt: number; durationMs: number },
        ];
        expect(responseContext).toMatchObject({
            url: "https://graphql.anilist.co",
            method: "POST",
            attempt: 1,
        });
        expect(responseContext.durationMs).toBeTypeOf("number");
        expect(responseContext.durationMs).toBeGreaterThanOrEqual(0);
    });
});

describe("rate limit info", () => {
    test("populates rateLimit from response headers on a 429", async () => {
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: {
                status: 429,
                data: {},
                headers: {
                    "x-ratelimit-limit": "90",
                    "x-ratelimit-remaining": "0",
                    "x-ratelimit-reset": "1700000000",
                },
            },
        });

        const error = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
            (requestError: unknown) => requestError
        );

        expect(error).toBeInstanceOf(AniLinkApiError);
        expect((error as AniLinkApiError).rateLimit).toEqual({
            limit: 90,
            remaining: 0,
            reset: 1700000000,
        });
        expect((error as Error).message).not.toContain("90");
    });

    test("leaves rateLimit undefined when headers are missing or incomplete", async () => {
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 500, data: {} },
        });
        const missing = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
            (requestError: unknown) => requestError
        );
        expect((missing as AniLinkApiError).rateLimit).toBeUndefined();

        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: {
                status: 429,
                data: {},
                headers: { "x-ratelimit-limit": "90" },
            },
        });
        const incomplete = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
            (requestError: unknown) => requestError
        );
        expect((incomplete as AniLinkApiError).rateLimit).toBeUndefined();
    });
});

void axios;
