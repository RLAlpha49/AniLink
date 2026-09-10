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
import { ResponseCache } from "../src/base/responseCache";
import { AniLink } from "../src/AniLink";
import { getAxiosStub } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build();
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

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
    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
        requiresAuth: false,
        options: {
            timeout: 5_000,
        },
    });

    expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 5_000 }));
});

test("forwards an AbortSignal to Axios", async () => {
    const controller = new AbortController();

    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
        requiresAuth: false,
        options: {
            signal: controller.signal,
        },
    });

    expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal })
    );
});

test.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid timeout %s",
    async (timeout) => {
        await expect(
            sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: {
                    timeout,
                },
            })
        ).rejects.toThrow(TypeError);
    }
);

test("allows zero to disable the Axios timeout", async () => {
    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
        requiresAuth: false,
        options: {
            timeout: 0,
        },
    });

    expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 0 }));
});

test("throws AniLinkAuthError when a token is required but missing", async () => {
    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
        requiresAuth: true,
    }).catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(AniLinkAuthError);
    expect(error).toMatchObject({ name: "AniLinkAuthError", code: "AUTH_ERROR" });
    expect(mocks.request).not.toHaveBeenCalled();
});

test("throws AniLinkAuthError for an empty-string token when auth is required", async () => {
    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, "", {
        requiresAuth: true,
    }).catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(AniLinkAuthError);
    expect(error).toMatchObject({ name: "AniLinkAuthError", code: "AUTH_ERROR" });
    expect(mocks.request).not.toHaveBeenCalled();
});

test("does not require a token when requiresAuth is false", async () => {
    await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
        requiresAuth: false,
    });

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

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
        requiresAuth: false,
        options: {
            retry: false,
        },
    }).catch((requestError: unknown) => requestError);

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

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
        requiresAuth: false,
        options: {
            retry: false,
        },
    }).catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(AniLinkApiError);
    expect(error).not.toHaveProperty("rawAxiosError");
});

test("exposes the original Axios error when explicitly enabled", async () => {
    // No `request` object: nothing sensitive to scrub, so the raw error
    // keeps its identity. (An error carrying a `request` object always has
    // it replaced with a marker — see the redaction tests below — because
    // a real Node ClientRequest embeds the sent header string, including
    // `Authorization`, in `_header`.)
    const axiosError = {
        isAxiosError: true,
        response: { status: 500, data: { message: "server error" } },
    };
    mocks.request.mockRejectedValueOnce(axiosError);

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
        requiresAuth: false,
        options: {
            exposeRawAxiosError: true,
            retry: false,
        },
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

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
        requiresAuth: false,
        options: {
            retry: false,
        },
    }).catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(AniLinkNetworkError);
    expect(error).toMatchObject({ name: "AniLinkNetworkError", code: "NETWORK_ERROR" });
    expect((error as Error).message).toBe("The request failed due to a network error.");
    expect((error as Error).message).not.toContain("secret-token");
});

test("classifies Axios timeout failures separately from other network failures", async () => {
    mocks.request.mockRejectedValueOnce({
        isAxiosError: true,
        code: "ETIMEDOUT",
        message: "timeout for secret-token",
    });

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
        requiresAuth: false,
        options: {
            retry: false,
        },
    }).catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(AniLinkNetworkError);
    expect(error).toMatchObject({
        name: "AniLinkNetworkError",
        code: "TIMEOUT_ERROR",
        timeoutMs: DEFAULT_REQUEST_TIMEOUT,
    });
    expect((error as Error).message).toBe("The request timed out.");
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
    expect((error as Error).message).toBe("The request was cancelled.");
});

test("normalizes unexpected transport failures without rethrowing raw values", async () => {
    mocks.request.mockRejectedValueOnce(new Error("secret-token leaked by adapter"));

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}).catch(
        (requestError: unknown) => requestError
    );

    expect(error).toBeInstanceOf(AniLinkError);
    expect(error).toMatchObject({ name: "AniLinkError", code: "UNKNOWN_ERROR" });
    expect((error as Error).message).toBe("The request failed.");
    expect((error as Error).message).not.toContain("secret-token");
});

test("preserves the original throwable in UNKNOWN failures when exposeRawAxiosError is enabled", async () => {
    const original = new Error("secret-token leaked by adapter");
    mocks.request.mockRejectedValueOnce(original);

    const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
        requiresAuth: false,
        options: {
            exposeRawAxiosError: true,
        },
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
    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, "", {
        requiresAuth: false,
    });

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

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: options,
        });
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: options,
        });

        expect(mocks.request).toHaveBeenCalledTimes(2);
        const timeouts = mocks.request.mock.calls.map(
            (call) => (call[0] as { timeout: number }).timeout
        );
        expect(timeouts).toEqual([5_000, 5_000]);
    });

    test("falls back to library defaults when no options are passed", async () => {
        vi.useFakeTimers();
        try {
            // The default policy retries a 500 even when no options are passed.
            mocks.request
                .mockRejectedValueOnce({
                    isAxiosError: true,
                    response: { status: 500, data: {} },
                })
                .mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });

            const promise = sendRequest("https://graphql.anilist.co", "POST", { query: "query" });
            await vi.advanceTimersByTimeAsync(10_000);
            await expect(promise).resolves.toEqual({ id: 1 });
            expect(mocks.request).toHaveBeenCalledTimes(2); // initial attempt + default-policy retry

            await sendRequest("https://graphql.anilist.co", "POST", { query: "query" });
            expect(mocks.request).toHaveBeenLastCalledWith(
                expect.objectContaining({ timeout: DEFAULT_REQUEST_TIMEOUT })
            );
        } finally {
            vi.useRealTimers();
        }
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

    test("emits onResponse exactly once when a 200 envelope carries GraphQL errors", async () => {
        // The success path fires onResponse for the HTTP 200 attempt, then
        // envelope unwrapping throws AniLinkGraphQLError. The catch path must
        // not re-emit onResponse for the same attempt.
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "Not authenticated." }], data: null },
        });

        const onResponse = vi.fn();
        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            {
                query: "query",
            },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false, onResponse },
            }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
        expect(onResponse).toHaveBeenCalledTimes(1);
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

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: {
                onRequestStart,
                onResponse,
            },
        });

        expect(events).toEqual(["start", "response"]);
        expect(onRequestStart).toHaveBeenCalledWith({
            requestId: expect.any(String),
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

        const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: false,
            options: { retry: false },
        }).catch((requestError: unknown) => requestError);

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
        const incomplete = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: false,
            options: { retry: false },
        }).catch((requestError: unknown) => requestError);
        expect((incomplete as AniLinkApiError).rateLimit).toBeUndefined();
    });
});

describe("hook exception isolation", () => {
    test("a throwing onRequestStart hook does not crash the request", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        await expect(
            sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: {
                    retry: false,
                    onRequestStart: () => {
                        throw new Error("telemetry exploded");
                    },
                },
            })
        ).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(
            expect.stringMatching(
                /^\[AniLink\] onRequestStart hook threw and was ignored \(requestId: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\):$/
            ),
            "telemetry exploded"
        );
        warn.mockRestore();
    });

    test("a throwing onResponse hook on success is swallowed and not retried", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        await expect(
            sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: {
                    retry: true,
                    onResponse: () => {
                        throw new Error("metrics down");
                    },
                },
            })
        ).resolves.toEqual({ id: 1 });
        // The hook failure must not be counted as a transport failure.
        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(
            expect.stringMatching(
                /^\[AniLink\] onResponse hook threw and was ignored \(requestId: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\):$/
            ),
            "metrics down"
        );
        warn.mockRestore();
    });

    test("a throwing onResponse hook on failure does not distort error classification", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 404, data: {} },
        });

        const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: false,
            options: {
                retry: false,
                onResponse: () => {
                    throw new Error("boom");
                },
            },
        }).catch((requestError: unknown) => requestError);

        // The original 404 classification survives; the hook failure is not
        // normalized as the request failure.
        expect(error).toBeInstanceOf(AniLinkApiError);
        expect((error as AniLinkApiError).status).toBe(404);
        expect(warn).toHaveBeenCalledWith(
            expect.stringMatching(/^\[AniLink\] onResponse hook threw and was ignored/),
            "boom"
        );
        warn.mockRestore();
    });
});

describe("GraphQL error metadata preservation", () => {
    test("preserves upstream status, locations, and extensions on AniLinkGraphQLError", async () => {
        const upstreamErrors = [
            {
                message: "Not Found.",
                status: 404,
                locations: [{ line: 1, column: 3 }],
                extensions: { code: "NOT_FOUND" },
            },
        ];
        mocks.request.mockResolvedValueOnce({
            data: { errors: upstreamErrors, data: null },
        });

        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false },
            }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
        expect((error as AniLinkGraphQLError).graphqlErrors).toEqual(upstreamErrors);
        expect((error as AniLinkGraphQLError).graphqlErrors[0]?.status).toBe(404);
        expect((error as AniLinkGraphQLError).graphqlErrors[0]?.extensions).toEqual({
            code: "NOT_FOUND",
        });
    });

    test("exposes partialData when GraphQL errors and data coexist", async () => {
        const partialData = { Media: { id: 1 } };
        mocks.request.mockResolvedValueOnce({
            data: {
                data: partialData,
                errors: [{ message: "favourite failed", status: 500 }],
            },
        });

        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false },
            }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
        expect((error as AniLinkGraphQLError).partialData).toEqual(partialData);
        expect((error as AniLinkGraphQLError).data).toEqual(partialData);
    });

    test("leaves partialData unset when no data accompanies the errors", async () => {
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "Not authenticated." }] },
        });

        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false },
            }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
        expect((error as AniLinkGraphQLError).partialData).toBeUndefined();
    });
});

describe("missing-token auth error context", () => {
    test("includes the operation name in the auth error message", async () => {
        const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: true,
            options: undefined,
            operation: "SaveMediaListEntryMutation",
        }).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkAuthError);
        expect(error).toMatchObject({ code: "AUTH_ERROR" });
        expect((error as Error).message).toContain("SaveMediaListEntryMutation");
    });

    test("keeps the generic message when no operation label is provided", async () => {
        const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: true,
        }).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkAuthError);
        expect((error as Error).message).not.toContain("(operation:");
    });
});

describe("response cache integration", () => {
    test("serves a cached GET response on the second call", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const options = { responseCache: cache };

        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            options,
        });
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            options,
        });

        // The second call is a cache hit: only one network request.
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("returns a value the caller can mutate without poisoning the cache", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const options = { responseCache: cache };

        const first = (await sendRequest(
            "https://graphql.anilist.co",
            "GET",
            undefined,
            undefined,
            {
                options,
            }
        )) as { id: number };
        first.id = 999; // caller mutates the reference they were handed

        const second = (await sendRequest(
            "https://graphql.anilist.co",
            "GET",
            undefined,
            undefined,
            {
                options,
            }
        )) as { id: number };

        expect(second).toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("caches per bearer-token identity so different tokens do not cross-contaminate", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const options = { responseCache: cache };

        await sendRequest("https://graphql.anilist.co", "GET", undefined, "token-a", {
            options,
        });
        await sendRequest("https://graphql.anilist.co", "GET", undefined, "token-b", {
            options,
        });

        // Different tokens: both go to the network.
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("does not store the raw bearer token in the cache key", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const secret = "super-secret-token-value-123456";
        const options = { responseCache: cache };

        await sendRequest("https://graphql.anilist.co", "GET", undefined, secret, {
            options,
        });

        // Inspect the cache's internal entries to confirm the raw token is
        // not a substring of any stored key. The key must use a hash instead.
        const entries = (
            cache as unknown as {
                entries: Map<string, unknown>;
            }
        ).entries;
        for (const key of entries.keys()) {
            expect(key).not.toContain(secret);
        }
    });

    test("fires onRequestStart and onResponse with cacheHit on a cache hit", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const onRequestStart = vi.fn();
        const onResponse = vi.fn();
        const options = { responseCache: cache, onRequestStart, onResponse };

        // First call: network round-trip, populates the cache.
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            options,
        });
        // Second call: cache hit — no network, but both hooks must fire.
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            options,
        });

        // The second call is a cache hit: only one network request.
        expect(mocks.request).toHaveBeenCalledTimes(1);

        // Both hooks fire once for the network attempt and once for the hit.
        expect(onRequestStart).toHaveBeenCalledTimes(2);
        expect(onResponse).toHaveBeenCalledTimes(2);

        // The hit's onResponse context carries cacheHit: true and durationMs: 0.
        const hitContext = onResponse.mock.calls[1][0];
        expect(hitContext).toMatchObject({ cacheHit: true, durationMs: 0 });
        // The network attempt's context must NOT carry cacheHit.
        const networkContext = onResponse.mock.calls[0][0];
        expect(networkContext).not.toHaveProperty("cacheHit");

        // The hit's onRequestStart context carries a fresh requestId.
        expect(hitContext.requestId).toEqual(expect.any(String));
        expect(hitContext.requestId).toBe(onRequestStart.mock.calls[1][0].requestId);
    });

    test("skips the cache when auth is supplied via a custom Authorization header", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const options = { responseCache: cache };

        // Two different identities authenticating via custom Authorization
        // headers (not the bearer-token field). The cache must fail closed
        // instead of collapsing both to the "none" namespace.
        await sendRequest(
            "https://graphql.anilist.co",
            "GET",
            undefined,
            {
                headers: { Authorization: "Basic user-a-credentials" },
            } as never,
            { options }
        );
        await sendRequest(
            "https://graphql.anilist.co",
            "GET",
            undefined,
            {
                headers: { Authorization: "Basic user-b-credentials" },
            } as never,
            { options }
        );

        // Both go to the network: the cache is skipped for header auth.
        expect(mocks.request).toHaveBeenCalledTimes(2);
        // Nothing is cached.
        const entries = (cache as unknown as { entries: Map<string, unknown> }).entries;
        expect(entries.size).toBe(0);
    });
});

describe("raw error redaction", () => {
    test("redacts sensitive request headers when exposeRawAxiosError is enabled", async () => {
        const secret = "Bearer super-secret-token-value";
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 500, data: { message: "server error" } },
            config: {
                headers: {
                    Authorization: secret,
                    Cookie: "session=private-session-id",
                    "Content-Type": "application/json",
                },
            },
        });

        const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: false,
            options: {
                exposeRawAxiosError: true,
                retry: false,
            },
        }).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkApiError);
        const raw = (error as AniLinkApiError).rawAxiosError as {
            config: { headers: Record<string, string> };
        };
        expect(raw.config.headers.Authorization).toBe("[REDACTED]");
        expect(raw.config.headers.Cookie).toBe("[REDACTED]");
        // Non-sensitive headers are preserved.
        expect(raw.config.headers["Content-Type"]).toBe("application/json");
        // The secret value does not survive anywhere in the serialized raw error.
        expect(JSON.stringify(raw)).not.toContain("super-secret-token-value");
        expect(JSON.stringify(raw)).not.toContain("private-session-id");
    });

    test("redacts sensitive headers reachable through response.config", async () => {
        const secret = "Bearer response-config-secret";
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: {
                status: 502,
                data: { message: "bad gateway" },
                headers: { "content-type": "application/json" },
                config: { headers: { Authorization: secret, "X-API-Key": "api-key-value" } },
            },
            config: { headers: { Authorization: "Bearer top-level-secret" } },
        });

        const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: false,
            options: { exposeRawAxiosError: true, retry: false },
        }).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkApiError);
        const raw = (error as AniLinkApiError).rawAxiosError as {
            response?: { config?: { headers?: Record<string, string> } };
        };
        expect(raw.response?.config?.headers?.Authorization).toBe("[REDACTED]");
        expect(raw.response?.config?.headers?.["X-API-Key"]).toBe("[REDACTED]");
        expect(JSON.stringify(raw)).not.toContain("response-config-secret");
        expect(JSON.stringify(raw)).not.toContain("api-key-value");
        expect(JSON.stringify(raw)).not.toContain("top-level-secret");
    });

    test("redacts set-cookie in the upstream response headers", async () => {
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: {
                status: 500,
                data: { message: "server error" },
                headers: {
                    "set-cookie": "session=private-session-cookie",
                    "content-type": "application/json",
                },
            },
            config: {},
        });

        const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: false,
            options: { exposeRawAxiosError: true, retry: false },
        }).catch((requestError: unknown) => requestError);

        const raw = (error as AniLinkApiError).rawAxiosError as {
            response?: { headers?: Record<string, string> };
        };
        expect(raw.response?.headers?.["set-cookie"]).toBe("[REDACTED]");
        expect(raw.response?.headers?.["content-type"]).toBe("application/json");
        expect(JSON.stringify(raw)).not.toContain("private-session-cookie");
    });

    test("redacts the raw ClientRequest reachable through error.request", async () => {
        // Node's ClientRequest carries `_header`: the raw request header
        // string including `Authorization: Bearer …`. A consumer logging the
        // raw error would surface it, so the clone must not share the live
        // request object.
        const fakeClientRequest = {
            _header: "POST / HTTP/1.1\r\nAuthorization: Bearer request-object-secret\r\n\r\n",
            method: "POST",
        };
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 500, data: { message: "server error" } },
            config: { headers: { Authorization: "Bearer config-secret" } },
            request: fakeClientRequest,
        });

        const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: false,
            options: { exposeRawAxiosError: true, retry: false },
        }).catch((requestError: unknown) => requestError);

        const raw = (error as AniLinkApiError).rawAxiosError as { request?: unknown };
        expect(raw.request).not.toBe(fakeClientRequest);
        expect(JSON.stringify(raw)).not.toContain("request-object-secret");
    });

    test("redacts the request body and basic-auth material on the cloned config", async () => {
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 500, data: { message: "server error" } },
            config: {
                headers: {},
                data: { password: "body-password-value", grant_type: "password" },
                auth: { username: "user", password: "basic-auth-secret" },
            },
        });

        const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: false,
            options: { exposeRawAxiosError: true, retry: false },
        }).catch((requestError: unknown) => requestError);

        const raw = (error as AniLinkApiError).rawAxiosError as {
            config?: { data?: unknown; auth?: unknown };
        };
        expect(JSON.stringify(raw)).not.toContain("body-password-value");
        expect(JSON.stringify(raw)).not.toContain("basic-auth-secret");
    });

    test("redacts additional credential header shapes (x-auth-token, session, proxy-auth)", async () => {
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 500, data: { message: "server error" } },
            config: {
                headers: {
                    "X-Auth-Token": "auth-token-value",
                    "X-Session-Id": "session-id-value",
                    "Proxy-Auth": "proxy-auth-value",
                    Accept: "application/json",
                },
            },
        });

        const error = await sendRequest("https://graphql.anilist.co", "POST", {}, undefined, {
            requiresAuth: false,
            options: { exposeRawAxiosError: true, retry: false },
        }).catch((requestError: unknown) => requestError);

        const raw = (error as AniLinkApiError).rawAxiosError as {
            config: { headers: Record<string, string> };
        };
        expect(raw.config.headers["X-Auth-Token"]).toBe("[REDACTED]");
        expect(raw.config.headers["X-Session-Id"]).toBe("[REDACTED]");
        expect(raw.config.headers["Proxy-Auth"]).toBe("[REDACTED]");
        // Non-credential headers stay intact.
        expect(raw.config.headers["Accept"]).toBe("application/json");
    });

});
