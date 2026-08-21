import axios from "axios";
import { beforeEach, expect, test, vi } from "vitest";
import {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkNetworkError,
} from "../src/base/AniLinkError";
import {
    configureRequestOptions,
    DEFAULT_REQUEST_TIMEOUT,
    sendRequest,
} from "../src/base/RequestHandler";

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
    configureRequestOptions({});
});

test("uses the default timeout with the shared Axios instance", async () => {
    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" });

    expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: DEFAULT_REQUEST_TIMEOUT })
    );
});

test("forwards a configured timeout to Axios", async () => {
    configureRequestOptions({ timeout: 5_000 });

    await sendRequest("https://graphql.anilist.co", "POST");

    expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 5_000 }));
});

test("forwards an AbortSignal to Axios", async () => {
    const controller = new AbortController();
    configureRequestOptions({ signal: controller.signal });

    await sendRequest("https://graphql.anilist.co", "POST");

    expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal })
    );
});

test.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid timeout %s", (timeout) => {
    expect(() => configureRequestOptions({ timeout })).toThrow(TypeError);
});

test("allows zero to disable the Axios timeout", () => {
    expect(() => configureRequestOptions({ timeout: 0 })).not.toThrow();
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
    configureRequestOptions({ exposeRawAxiosError: true });
    mocks.request.mockRejectedValueOnce(axiosError);

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
        (requestError: unknown) => requestError
    );

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

test("passes through the envelope unchanged when it has no data object", async () => {
    const envelope = { errors: [{ message: "Not authenticated." }] };
    mocks.request.mockResolvedValueOnce({ data: envelope });

    await expect(
        sendRequest("https://graphql.anilist.co", "POST", { query: "query" })
    ).resolves.toEqual(envelope);
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

void axios;
