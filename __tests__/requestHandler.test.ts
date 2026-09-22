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

test("rejects a defined-but-invalid rateLimitFloor instead of silently coercing it", async () => {
    // A fractional, negative, or non-finite floor is a caller bug: coercing
    // `0` to `1` would make "never pace on floor" inexpressible except by
    // disabling pacing entirely.
    for (const rateLimitFloor of [-1, 2.5, Number.NaN, Infinity]) {
        await expect(
            sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: { rateLimitFloor },
            })
        ).rejects.toThrow(/rateLimitFloor/);
    }
    expect(mocks.request).not.toHaveBeenCalled();
});

test("accepts a rateLimitFloor of 0 as the explicit no-floor pacing configuration", async () => {
    await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
        requiresAuth: false,
        options: { rateLimitFloor: 0 },
    });

    expect(mocks.request).toHaveBeenCalledTimes(1);
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

test("unwrapGraphQLResponse isolates a throwing onPartialData observer", () => {
    // `unwrapGraphQLResponse` is exported: a direct consumer passing a
    // throwing `onPartialData` callback must not have that throw treated
    // as the request failure — the resolved data wins, mirroring how the
    // request pipeline routes the observer through its failure reporter.
    const envelope = { data: { Media: { id: 5 } }, errors: [{ message: "field failed" }] };

    expect(
        unwrapGraphQLResponse(envelope, undefined, {
            allowPartialData: true,
            onPartialData: () => {
                throw new Error("observer exploded");
            },
        })
    ).toEqual({ id: 5 });
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

    test("a 200 error envelope's onResponse carries rateLimit and cacheHit facts", async () => {
        // The pre-extraction payload: the HTTP 200 attempt succeeded, so its
        // onResponse emission reports the parsed rate-limit headers and the
        // cache-miss marker even though the envelope later throws.
        const cache = new ResponseCache({ ttlMs: 10_000 });
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "Not found." }], data: null },
            headers: {
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "89",
                "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
            },
        });

        const onResponse = vi.fn();
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            {
                requiresAuth: false,
                options: { retry: false, responseCache: cache, onResponse },
            }
        ).catch(() => {
            // The envelope throws; the emission is what this test asserts.
        });

        expect(onResponse).toHaveBeenCalledTimes(1);
        const context = onResponse.mock.calls[0][0];
        expect(context.cacheHit).toBe(false);
        expect(context.rateLimit).toMatchObject({ limit: 90, remaining: 89 });
        expect(context.cacheWrite).toBeUndefined();
    });

    test("a partial-success envelope reports onResponse before onError", async () => {
        // The pre-extraction ordering: the attempt's onResponse fires before
        // the partial envelope's error entries surface through onError, so
        // consumers joining the two streams see a stable order.
        const events: string[] = [];
        const onResponse = vi.fn(() => {
            events.push("response");
        });
        const onError = vi.fn(() => {
            events.push("error");
        });
        mocks.request.mockResolvedValueOnce({
            data: {
                data: { Media: { id: 1 }, Page: null },
                errors: [{ message: "Page failed." }],
            },
        });

        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } Page { media { id } } }" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false, allowPartialData: true, onResponse, onError },
            }
        );

        expect(events).toEqual(["response", "error"]);
        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledTimes(1);
    });
});

describe("error-context observability fields", () => {
    test("a terminal retryable failure in a spent window reports budgetExhausted", async () => {
        // A 429 is retryable under the policy; with the shared budget
        // already spent by an earlier request, the 429 surfaces with
        // budgetExhausted: true — the chronic-exhaustion signal.
        const stateOwner = {};
        const options = {
            retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 },
            retryBudget: { maxRetriesPerWindow: 1, windowMs: 60_000 },
        };

        // Prime the budget: this request's retry spends the window's single
        // unit (429 → retry → success).
        mocks.request
            .mockRejectedValueOnce({
                isAxiosError: true,
                response: { status: 429, data: {}, headers: {} },
            })
            .mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            { requiresAuth: false, options, stateOwner }
        );

        // The next request's 429 is retryable but the window is spent: it
        // surfaces with budgetExhausted.
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 429, data: {}, headers: {} },
        });
        const onError = vi.fn();
        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            { requiresAuth: false, options: { ...options, onError }, stateOwner }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkApiError);
        expect(onError).toHaveBeenCalled();
        const context = onError.mock.calls.at(-1)?.[1];
        expect(context.budgetExhausted).toBe(true);
        expect(context.retryWaitMs).toBeUndefined();
    });

    test("a never-retryable failure in a spent window does not report budgetExhausted", async () => {
        // A 404 is never retryable; landing in a spent window must not be
        // miscounted as chronic budget exhaustion.
        const stateOwner = {};
        const options = {
            retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 1 },
            retryBudget: { maxRetriesPerWindow: 1, windowMs: 60_000 },
        };

        // Spend the window's single retry unit.
        mocks.request
            .mockRejectedValueOnce({
                isAxiosError: true,
                response: { status: 429, data: {}, headers: {} },
            })
            .mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            { requiresAuth: false, options, stateOwner }
        );

        // A 404 in the same spent window: never retryable, so no
        // budgetExhausted flag.
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 404, data: {}, headers: {} },
        });
        const onError = vi.fn();
        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            { requiresAuth: false, options: { ...options, onError }, stateOwner }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkApiError);
        const context = onError.mock.calls.at(-1)?.[1];
        expect(context.budgetExhausted).toBeUndefined();
    });

    test("retryWaitMs accumulates server-dictated waits across attempts", async () => {
        // Two 429s with Retry-After: 1, then the terminal failure: the
        // terminal report carries the accumulated wait of the first retry's
        // server-dictated delay (the second never sleeps — it surfaces).
        const onError = vi.fn();
        mocks.request
            .mockRejectedValueOnce({
                isAxiosError: true,
                response: { status: 429, data: {}, headers: { "retry-after": "1" } },
            })
            .mockRejectedValueOnce({
                isAxiosError: true,
                response: { status: 429, data: {}, headers: { "retry-after": "1" } },
            });

        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            {
                requiresAuth: false,
                options: {
                    retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 1 },
                    retryBudget: { maxRetriesPerWindow: 5, windowMs: 60_000 },
                    onError,
                },
            }
        ).catch(() => {
            // The request surfaces the second 429; the emission is the
            // assertion target.
        });

        const context = onError.mock.calls.at(-1)?.[1];
        // The first retry slept the 1-second server-dictated wait; the
        // terminal report carries it.
        expect(context.retryWaitMs).toBeGreaterThanOrEqual(1_000);
    });

    test("a circuit-open fast-fail reports host and retryAfterMs", async () => {
        // Trip the breaker, then fast-fail: the terminal onError context
        // carries the host scope and the cooldown remaining.
        const stateOwner = {};
        const options = {
            retry: false,
            circuitBreaker: { threshold: 1, cooldownMs: 30_000 },
        };

        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 500, data: {}, headers: {} },
        });
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            { requiresAuth: false, options, stateOwner }
        ).catch(() => {
            // The 500 trips the breaker (threshold 1).
        });

        const onError = vi.fn();
        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            { requiresAuth: false, options: { ...options, onError }, stateOwner }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkNetworkError);
        expect(onError).toHaveBeenCalledTimes(1);
        const context = onError.mock.calls[0][1];
        expect(context.host).toBe("graphql.anilist.co");
        expect(context.retryAfterMs).toBeGreaterThan(0);
    });

    test("cacheWrite marks a cache-miss read whose response was written back", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const onResponse = vi.fn();
        const options = { responseCache: cache, onResponse };

        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            { options }
        );

        // The network-served response was written back: the emission
        // carries cacheWrite: true alongside cacheHit: false.
        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onResponse.mock.calls[0][0]).toMatchObject({
            cacheHit: false,
            cacheWrite: true,
        });
    });

    test("bypassResponseCache skips the cache lookup and the write-back", async () => {
        // A freshness-critical read (a watcher poll) opts out of the cache
        // per request: a fresh cached entry must not be served, and the
        // network response must not be written back over the cached one.
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const onResponse = vi.fn();
        const options = { responseCache: cache, bypassResponseCache: true, onResponse };

        // Prime the cache with a read the bypassed request duplicates.
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            { options: { responseCache: cache } }
        );
        onResponse.mockClear();
        mocks.request.mockClear();

        const result = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            { options }
        );

        // The request went to the network (not served from cache) and was
        // not written back: a bypassed read carries no cache markers at
        // all — no `cacheHit` (it is not a cache read) and no `cacheWrite`.
        // The single-root unwrap resolves the bare field value.
        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onResponse.mock.calls[0][0]).not.toHaveProperty("cacheHit");
        expect(onResponse.mock.calls[0][0]).not.toHaveProperty("cacheWrite");
        expect(result).toEqual({ id: 1 });
    });

    test("a partial-success envelope resolved by allowPartialData reports no cacheWrite", async () => {
        // The third cache outcome: a cacheable read whose response was NOT
        // written back because the partial envelope is excluded from
        // caching. The emission must not carry cacheWrite, so fill-rate
        // metrics do not overcount.
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const onResponse = vi.fn();
        const options = { responseCache: cache, allowPartialData: true, onResponse };

        mocks.request.mockResolvedValueOnce({
            data: {
                data: { User: { id: 1 }, Page: { id: 2 } },
                errors: [{ message: "favourite failed", status: 500 }],
            },
        });
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { User { id } Page { id } }" },
            "token",
            { options }
        );

        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onResponse.mock.calls[0][0]).toMatchObject({ cacheHit: false });
        expect(onResponse.mock.calls[0][0]).not.toHaveProperty("cacheWrite");
    });

    test("an invalidation-guarded write-back drop reports no cacheWrite", async () => {
        // The third cache outcome, in-flight flavor: a read whose response
        // arrived after an invalidation affecting it landed, so the
        // generation guard dropped the write-back. The emission must not
        // carry cacheWrite.
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const onResponse = vi.fn();
        const options = { responseCache: cache, onResponse };

        // Hold the read's network response pending.
        let resolveRead:
            ((value: { data: { data: { Media: { id: number } } } }) => void) | undefined;
        mocks.request.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    resolveRead = resolve;
                })
        );
        const readPromise = sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            "token",
            { options }
        );
        readPromise.catch(() => {});

        // While the read is in flight, a mapped mutation at the same
        // endpoint invalidates the affected root field.
        mocks.request.mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "mutation { SaveMediaListEntry (mediaId: 1) { id } }" },
            "token",
            { options }
        );

        // The read completes with its pre-mutation response; the write-back
        // is dropped by the in-flight guard.
        resolveRead?.({ data: { data: { Media: { id: 1 } } } });
        await readPromise;

        expect(onResponse).toHaveBeenCalledTimes(2);
        // The mutation completed first, so the read's emission is the
        // second one.
        const readEmission = onResponse.mock.calls[1][0];
        expect(readEmission).toMatchObject({ cacheHit: false });
        expect(readEmission).not.toHaveProperty("cacheWrite");
    });

    test("an auth-required read with no token is not served a cache hit", async () => {
        // The auth guard gates the cache read: an anonymous-namespace entry
        // must not satisfy a requiresAuth request.
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const options = { responseCache: cache };

        // Prime the anonymous namespace with a read.
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            undefined,
            { requiresAuth: false, options }
        );
        expect(mocks.request).toHaveBeenCalledTimes(1);

        // The same read, auth-required, with no token: fails fast with
        // AniLinkAuthError instead of the anonymous cache hit.
        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query { Media (id: 1) { id } }" },
            undefined,
            { requiresAuth: true, options }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });
});

describe("request lifecycle hooks", () => {
    test("invokes onRequestStart then onResponse with the attempt duration", async () => {
        const events: string[] = [];
        const onRequestStart = vi.fn(() => {
            events.push("start");
        });
        const onResponse = vi.fn((_context: unknown) => {
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
        const responseContext = onResponse.mock.calls[0]?.[0] as {
            url: string;
            method: string;
            attempt: number;
            durationMs: number;
        };
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
        expect(warn).toHaveBeenCalledTimes(1);
        const record = JSON.parse(warn.mock.calls[0][0] as string);
        expect(record.source).toBe("anilink");
        expect(record.kind).toBe("hook-failure");
        expect(record.hookName).toBe("onRequestStart");
        expect(record.requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
        expect(record.message).toBe(
            "The onRequestStart hook threw and was ignored: telemetry exploded"
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
        expect(warn).toHaveBeenCalledTimes(1);
        const record = JSON.parse(warn.mock.calls[0][0] as string);
        expect(record.source).toBe("anilink");
        expect(record.kind).toBe("hook-failure");
        expect(record.hookName).toBe("onResponse");
        expect(record.requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
        expect(record.message).toBe("The onResponse hook threw and was ignored: metrics down");
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
        expect(warn).toHaveBeenCalledTimes(1);
        const record = JSON.parse(warn.mock.calls[0][0] as string);
        expect(record.hookName).toBe("onResponse");
        expect(record.message).toBe("The onResponse hook threw and was ignored: boom");
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

    test("allowPartialData resolves the data and reports the errors through onError", async () => {
        const partialData = { User: { id: 1 }, Page: { id: 2 } };
        mocks.request.mockResolvedValueOnce({
            data: {
                data: partialData,
                errors: [{ message: "favourite failed", status: 500 }],
            },
        });

        const onError = vi.fn();
        const result = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false, allowPartialData: true, onError },
            }
        );

        // A multi-root-field document resolves with the full envelope.
        expect(result).toEqual({
            data: partialData,
            errors: [{ message: "favourite failed", status: 500 }],
        });
        expect(onError).toHaveBeenCalledTimes(1);
        const [reportedError, context] = onError.mock.calls[0];
        expect(reportedError).toBeInstanceOf(AniLinkGraphQLError);
        expect((reportedError as AniLinkGraphQLError).graphqlErrors).toEqual([
            { message: "favourite failed", status: 500 },
        ]);
        expect((reportedError as AniLinkGraphQLError).partialData).toEqual(partialData);
        expect(context).toMatchObject({
            url: "https://graphql.anilist.co",
            method: "POST",
            attempt: 1,
            code: "GRAPHQL_ERROR",
            status: 500,
        });
        expect(typeof context.requestId).toBe("string");
        expect((reportedError as AniLinkError).requestId).toBe(context.requestId);
    });

    test("allowPartialData unwraps a single-root-field partial envelope to the bare value", async () => {
        mocks.request.mockResolvedValueOnce({
            data: {
                data: { Media: { id: 1 } },
                errors: [{ message: "field failed" }],
            },
        });

        const result = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false, allowPartialData: true },
            }
        );

        expect(result).toEqual({ id: 1 });
    });

    test("allowPartialData still throws when no usable data accompanies the errors", async () => {
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "Not authenticated." }], data: null },
        });

        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false, allowPartialData: true },
            }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
    });

    test("allowPartialData still throws when every root field failed (empty data object)", async () => {
        // `data: {}` with errors means no root field resolved: returning the
        // raw envelope as the result would hand the caller a shape its
        // types do not predict, so the envelope must throw like the strict
        // mode.
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "everything failed" }], data: {} },
        });

        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false, allowPartialData: true },
            }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
    });

    test("allowPartialData still throws when the only root field resolved to null", async () => {
        // Per GraphQL semantics, a nullable root field that errors comes
        // back inside `data` as `null` — not as `data: null`. A single-root
        // field document whose root field failed therefore carries
        // `data: { Media: null }`: one key, but nothing usable. Resolving
        // that envelope with `null` would hand the caller a value its
        // types do not predict (and one indistinguishable from a
        // legitimate null), so it must throw like the strict mode.
        mocks.request.mockResolvedValueOnce({
            data: { errors: [{ message: "field failed" }], data: { Media: null } },
        });

        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false, allowPartialData: true },
            }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
    });

    test("allowPartialData still throws when every root field resolved to null", async () => {
        // Multi-field variant: every root field failed, each surfacing as
        // a null member of `data`. No usable field resolved, so the
        // envelope throws regardless of the opt-in.
        mocks.request.mockResolvedValueOnce({
            data: {
                errors: [{ message: "everything failed" }],
                data: { User: null, Page: null },
            },
        });

        const error = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false, allowPartialData: true },
            }
        ).catch((requestError: unknown) => requestError);

        expect(error).toBeInstanceOf(AniLinkGraphQLError);
    });

    test("allowPartialData resolves a mixed envelope where at least one root field is non-null", async () => {
        // The guard is per-field usability, not per-envelope: one resolved
        // root field is enough to resolve, even when its siblings failed
        // to null.
        mocks.request.mockResolvedValueOnce({
            data: {
                errors: [{ message: "favourite failed", status: 500 }],
                data: { User: { id: 1 }, Page: null },
            },
        });

        const result = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { retry: false, allowPartialData: true },
            }
        );

        // Multi-root-field document: the full envelope resolves.
        expect(result).toEqual({
            errors: [{ message: "favourite failed", status: 500 }],
            data: { User: { id: 1 }, Page: null },
        });
    });

    test("allowPartialData does not retry a partial envelope", async () => {
        // The partial data is a terminal outcome for the attempt: the
        // resolved fields are returned, not retried, even under the default
        // retry policy where a status-500 GraphQL error would retry.
        mocks.request.mockResolvedValueOnce({
            data: {
                data: { User: { id: 1 } },
                errors: [{ message: "favourite failed", status: 500 }],
            },
        });

        const result = await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "query" },
            undefined,
            {
                requiresAuth: false,
                options: { allowPartialData: true },
            }
        );

        // Single-root-field document: the partial envelope unwraps to the
        // bare User value, and the attempt is not retried.
        expect(result).toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(1);
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

    test("serves a cached GraphQL query POST on the second call", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const options = { responseCache: cache };
        const body = { query: "query ($id: Int) { Media (id: $id) { id } }", variables: { id: 1 } };

        await sendRequest("https://graphql.anilist.co", "POST", body, undefined, {
            options,
        });
        await sendRequest("https://graphql.anilist.co", "POST", body, undefined, {
            options,
        });

        // The second identical query POST is a cache hit: one network request.
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("does not cache a GraphQL mutation POST", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const options = { responseCache: cache };
        const body = { query: "mutation { SaveMediaListEntry (mediaId: 1) { id } }" };

        await sendRequest("https://graphql.anilist.co", "POST", body, undefined, {
            options,
        });
        await sendRequest("https://graphql.anilist.co", "POST", body, undefined, {
            options,
        });

        // Mutations are never cached: both calls go to the network.
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("does not cache a REST POST body", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const options = { responseCache: cache };

        await sendRequest(
            "https://api.myanimelist.net/v2/anime/21",
            "POST",
            { status: "completed" },
            undefined,
            { options, protocol: "rest", contentType: "application/json" }
        );
        await sendRequest(
            "https://api.myanimelist.net/v2/anime/21",
            "POST",
            { status: "completed" },
            undefined,
            { options, protocol: "rest", contentType: "application/json" }
        );

        // REST writes are never cached: both calls go to the network.
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("keys GraphQL query cache entries by variables so different variables miss", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const options = { responseCache: cache };
        const document = "query ($id: Int) { Media (id: $id) { id } }";

        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: document, variables: { id: 1 } },
            undefined,
            { options }
        );
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: document, variables: { id: 2 } },
            undefined,
            { options }
        );

        // Different variables: different cache key, so both go to the network.
        expect(mocks.request).toHaveBeenCalledTimes(2);
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
        // The network attempt's context carries cacheHit: false: the read
        // was cacheable but the cache was empty, so consumers can count
        // misses directly instead of subtracting hits from totals.
        const networkContext = onResponse.mock.calls[0][0];
        expect(networkContext).toMatchObject({ cacheHit: false });

        // The hit's onRequestStart context carries a fresh requestId.
        expect(hitContext.requestId).toEqual(expect.any(String));
        expect(hitContext.requestId).toBe(onRequestStart.mock.calls[1][0].requestId);
    });

    test("marks a cacheable read's network response with cacheHit: false", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const onResponse = vi.fn();
        const options = { responseCache: cache, onResponse };

        // A cacheable GET read that misses the cache: the network-served
        // response must carry cacheHit: false.
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            options,
        });

        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onResponse.mock.calls[0][0]).toMatchObject({ cacheHit: false });
    });

    test("does not cache a partial-success envelope resolved by allowPartialData", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const onError = vi.fn();
        const options = { responseCache: cache, allowPartialData: true, onError };
        const body = { query: "query { User { id } Page { id } }" };

        // First call: a partial envelope resolves with the data and reports
        // the errors through onError.
        mocks.request.mockResolvedValueOnce({
            data: {
                data: { User: { id: 1 }, Page: { id: 2 } },
                errors: [{ message: "favourite failed", status: 500 }],
            },
        });
        const first = await sendRequest("https://graphql.anilist.co", "POST", body, undefined, {
            requiresAuth: false,
            options,
        });
        expect(first).toEqual({
            data: { User: { id: 1 }, Page: { id: 2 } },
            errors: [{ message: "favourite failed", status: 500 }],
        });
        expect(onError).toHaveBeenCalledTimes(1);

        // Second identical call: the degraded result must NOT be served from
        // the cache — a cache hit would replay the partial data without the
        // onError reporting that accompanied the original fetch.
        mocks.request.mockResolvedValueOnce({
            data: { data: { User: { id: 1 }, Page: { id: 2 } } },
        });
        const second = await sendRequest("https://graphql.anilist.co", "POST", body, undefined, {
            requiresAuth: false,
            options,
        });

        expect(mocks.request).toHaveBeenCalledTimes(2);
        // A two-root-field document resolves with the full envelope.
        expect(second).toEqual({ data: { User: { id: 1 }, Page: { id: 2 } } });
        // The second call's clean envelope carries no errors, so onError
        // fired only for the first call's partial data.
        expect(onError).toHaveBeenCalledTimes(1);
    });

    test("does not mark a mutation's response with cacheHit", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const onResponse = vi.fn();
        const options = { responseCache: cache, onResponse };

        // A GraphQL mutation is never cache-keyed, so its response carries
        // no cacheHit marker at all — not a miss, just cache-unrelated.
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            { query: "mutation { SaveMediaListEntry { id } }" },
            undefined,
            { options }
        );

        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onResponse.mock.calls[0][0]).not.toHaveProperty("cacheHit");
    });

    test("does not mark a fail-closed header-auth read with cacheHit", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const onResponse = vi.fn();
        const options = { responseCache: cache, onResponse };

        // A read whose credentials the cache key cannot capture skips the
        // cache entirely (fail closed): no cacheHit marker, because the
        // request never consulted the cache.
        await sendRequest(
            "https://graphql.anilist.co",
            "GET",
            undefined,
            {
                headers: { Authorization: "Basic user-a-credentials" },
            } as never,
            { options }
        );

        expect(onResponse).toHaveBeenCalledTimes(1);
        expect(onResponse.mock.calls[0][0]).not.toHaveProperty("cacheHit");
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

    test("a fail-closed header-auth read does not wipe the endpoint's cached queries", async () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const options = { responseCache: cache };
        const body = { query: "query { Viewer { id } }" };

        // Prime the cache with a bearer-token query read at the endpoint.
        await sendRequest("https://graphql.anilist.co", "POST", body, "token", {
            options,
        });
        expect(mocks.request).toHaveBeenCalledTimes(1);

        // A header-authenticated identity's identical query read fails
        // closed (the cache is skipped for it) — but a read must never be
        // mistaken for a mutation and invalidate the endpoint's entries.
        await sendRequest(
            "https://graphql.anilist.co",
            "POST",
            body,
            {
                headers: { Authorization: "Basic user-a-credentials" },
            } as never,
            { options }
        );
        expect(mocks.request).toHaveBeenCalledTimes(2);

        // The bearer-token read is still a cache hit: the header-auth read
        // left the endpoint's cached queries intact.
        await sendRequest("https://graphql.anilist.co", "POST", body, "token", {
            options,
        });
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    describe("mutation-triggered invalidation", () => {
        test("a successful mutation invalidates the cached read of the mutated resource", async () => {
            const cache = new ResponseCache({ ttlMs: 10_000 });
            const options = { responseCache: cache };

            // Prime the cache with a read of the resource.
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21?fields=list_status",
                "GET",
                undefined,
                "token",
                {
                    options,
                }
            );
            expect(mocks.request).toHaveBeenCalledTimes(1);

            // Mutate the same resource through its action sub-path.
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21/my_list_status",
                "PATCH",
                { status: "completed" },
                "token",
                { options, protocol: "rest" }
            );

            // The cached read was dropped: the next read refetches.
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21?fields=list_status",
                "GET",
                undefined,
                "token",
                {
                    options,
                }
            );
            expect(mocks.request).toHaveBeenCalledTimes(3);
        });

        test("a mutation invalidates cached reads across auth namespaces", async () => {
            const cache = new ResponseCache({ ttlMs: 10_000 });
            const options = { responseCache: cache };

            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21",
                "GET",
                undefined,
                "token-a",
                {
                    options,
                }
            );
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21",
                "GET",
                undefined,
                "token-b",
                {
                    options,
                }
            );
            expect(mocks.request).toHaveBeenCalledTimes(2);

            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21/my_list_status",
                "DELETE",
                undefined,
                "token-a",
                { options, protocol: "rest" }
            );

            // Both identities' cached reads were dropped: both refetch.
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21",
                "GET",
                undefined,
                "token-a",
                {
                    options,
                }
            );
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21",
                "GET",
                undefined,
                "token-b",
                {
                    options,
                }
            );
            // 2 initial reads + 1 mutation + 2 refetches.
            expect(mocks.request).toHaveBeenCalledTimes(5);
        });

        test("a failed mutation leaves the cached read intact", async () => {
            const cache = new ResponseCache({ ttlMs: 10_000 });
            const options = { responseCache: cache, retry: false };

            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21",
                "GET",
                undefined,
                "token",
                {
                    options,
                }
            );
            expect(mocks.request).toHaveBeenCalledTimes(1);

            mocks.request.mockRejectedValueOnce({
                isAxiosError: true,
                response: { status: 500, data: { message: "boom" } },
            });
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21/my_list_status",
                "PATCH",
                { status: "watching" },
                "token",
                { options, protocol: "rest" }
            ).catch(() => undefined);

            // The cached read survived the failed mutation: still a hit.
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21",
                "GET",
                undefined,
                "token",
                {
                    options,
                }
            );
            expect(mocks.request).toHaveBeenCalledTimes(2);
        });

        test("a collection write or non-numeric path invalidates nothing", async () => {
            const cache = new ResponseCache({ ttlMs: 10_000 });
            const options = { responseCache: cache };

            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21",
                "GET",
                undefined,
                "token",
                {
                    options,
                }
            );
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/42",
                "GET",
                undefined,
                "token",
                {
                    options,
                }
            );
            expect(mocks.request).toHaveBeenCalledTimes(2);

            // A collection write has no numeric resource id: no invalidation.
            await sendRequest(
                "https://api.myanimelist.net/v2/anime",
                "POST",
                { title: "new" },
                "token",
                { options, protocol: "rest" }
            );

            // Both cached reads are still hits.
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21",
                "GET",
                undefined,
                "token",
                {
                    options,
                }
            );
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/42",
                "GET",
                undefined,
                "token",
                {
                    options,
                }
            );
            expect(mocks.request).toHaveBeenCalledTimes(3);
        });

        test("a GraphQL mutation invalidates a cached GET keyed at the endpoint URL too", async () => {
            const cache = new ResponseCache({ ttlMs: 10_000 });
            const options = { responseCache: cache };

            await sendRequest("https://graphql.anilist.co", "GET", undefined, "token", {
                options,
            });
            expect(mocks.request).toHaveBeenCalledTimes(1);

            // A GraphQL mutation document invalidates every cached read at
            // the endpoint — including a GET entry keyed at the same URL.
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "mutation {...}" },
                "token",
                {
                    options,
                }
            );

            await sendRequest("https://graphql.anilist.co", "GET", undefined, "token", {
                options,
            });
            expect(mocks.request).toHaveBeenCalledTimes(3);
        });

        test("a successful unmapped GraphQL mutation invalidates the cached GraphQL queries at the endpoint", async () => {
            // A mutation whose root field is not in the scoped-invalidation map
            // keeps the conservative whole-endpoint invalidation: every cached
            // query at the endpoint is dropped, so an unmapped (including any
            // future upstream) mutation can never under-invalidate.
            const cache = new ResponseCache({ ttlMs: 10_000 });
            const options = { responseCache: cache };

            // Prime the cache with two GraphQL query reads at the endpoint.
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "query { Media (id: 1) { id } }" },
                "token",
                { options }
            );
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "query { Viewer { id } }" },
                "token",
                { options }
            );
            expect(mocks.request).toHaveBeenCalledTimes(2);

            // An unmapped GraphQL mutation through the same endpoint.
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "mutation { DeleteThread (id: 1) { id } }" },
                "token",
                { options }
            );

            // Both cached queries were dropped: both refetch.
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "query { Media (id: 1) { id } }" },
                "token",
                { options }
            );
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "query { Viewer { id } }" },
                "token",
                { options }
            );
            // 2 initial reads + 1 mutation + 2 refetches.
            expect(mocks.request).toHaveBeenCalledTimes(5);
        });

        test("a mapped GraphQL mutation invalidates only the affected root fields' cached queries", async () => {
            // Root-field-scoped invalidation: a SaveMediaListEntry changes
            // what MediaList/MediaListCollection/Page/Media/User/Viewer
            // queries can report (the list-entry state those documents can
            // embed), but cannot change what a Staff query returns — that
            // cached entry stays warm instead of being flushed wholesale.
            const cache = new ResponseCache({ ttlMs: 10_000 });
            const options = { responseCache: cache };

            // Prime the cache with one affected and one unaffected read.
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "query { MediaList (userId: 1) { id } }" },
                "token",
                { options }
            );
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "query { Staff (id: 1) { id } }" },
                "token",
                { options }
            );
            expect(mocks.request).toHaveBeenCalledTimes(2);

            // A mapped mutation through the same endpoint.
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "mutation { SaveMediaListEntry (mediaId: 1) { id } }" },
                "token",
                { options }
            );

            // The affected MediaList read was dropped: it refetches.
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "query { MediaList (userId: 1) { id } }" },
                "token",
                { options }
            );
            expect(mocks.request).toHaveBeenCalledTimes(4);

            // The unaffected Staff read survived the scoped invalidation:
            // still a cache hit, no refetch.
            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "query { Staff (id: 1) { id } }" },
                "token",
                { options }
            );
            expect(mocks.request).toHaveBeenCalledTimes(4);
        });

        test("a GraphQL mutation does not drop cached reads at other URLs", async () => {
            const cache = new ResponseCache({ ttlMs: 10_000 });
            const options = { responseCache: cache };

            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "query { Viewer { id } }" },
                "token",
                { options }
            );
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21",
                "GET",
                undefined,
                "token",
                { options }
            );
            expect(mocks.request).toHaveBeenCalledTimes(2);

            await sendRequest(
                "https://graphql.anilist.co",
                "POST",
                { query: "mutation { SaveMediaListEntry (mediaId: 1) { id } }" },
                "token",
                { options }
            );

            // The MAL read at a different URL is untouched: still a hit.
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21",
                "GET",
                undefined,
                "token",
                { options }
            );
            expect(mocks.request).toHaveBeenCalledTimes(3);
        });

        test("a read in flight when a mutation lands does not re-cache its stale response", async () => {
            const cache = new ResponseCache({ ttlMs: 10_000 });
            const options = { responseCache: cache };

            // Start a read whose network response resolves after the
            // mutation completes.
            let resolveRead: ((value: { data: { data: unknown } }) => void) | undefined;
            mocks.request.mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveRead = resolve;
                    })
            );
            const readPromise = sendRequest(
                "https://api.myanimelist.net/v2/anime/21?fields=list_status",
                "GET",
                undefined,
                "token",
                { options }
            );

            // While the read is in flight, a mutation to the same resource
            // completes and invalidates the (not yet written) cached read.
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21/my_list_status",
                "PATCH",
                { status: "completed" },
                "token",
                { options, protocol: "rest" }
            );

            // The read completes with its pre-mutation (stale) response.
            resolveRead?.({ data: { data: { stale: true } } });
            await readPromise;

            // The stale response was not re-cached: the next read refetches.
            await sendRequest(
                "https://api.myanimelist.net/v2/anime/21?fields=list_status",
                "GET",
                undefined,
                "token",
                { options }
            );
            // 1 in-flight read + 1 mutation + 1 refetch (the stale write was skipped).
            expect(mocks.request).toHaveBeenCalledTimes(3);
        });
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

    test("accepts a string body and forwards it verbatim", async () => {
        await sendRequest(
            "https://example.test/token",
            "POST",
            "grant_type=refresh_token",
            undefined,
            {
                requiresAuth: false,
                options: { retry: false },
                contentType: "application/x-www-form-urlencoded",
                protocol: "rest",
            }
        );

        expect(mocks.request).toHaveBeenCalledWith(
            expect.objectContaining({
                data: "grant_type=refresh_token",
                headers: expect.objectContaining({
                    "Content-Type": "application/x-www-form-urlencoded",
                }),
            })
        );
    });
});

describe("diagnostics option", () => {
    test("defaults to warn mode", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: {
                retry: false,
                onResponse: () => {
                    throw new Error("boom");
                },
            },
        });

        expect(warn).toHaveBeenCalledTimes(1);
        expect(JSON.parse(warn.mock.calls[0][0] as string).kind).toBe("hook-failure");
        warn.mockRestore();
    });

    test("silent mode suppresses the hook-failure fallback", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: {
                retry: false,
                diagnostics: "silent",
                onResponse: () => {
                    throw new Error("boom");
                },
            },
        });

        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    test("hook mode never touches the console without an observer", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: {
                retry: false,
                diagnostics: "hook",
                onResponse: () => {
                    throw new Error("boom");
                },
            },
        });

        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    test("hook mode still routes to a configured onHookError", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const onHookError = vi.fn();
        const thrown = new Error("boom");

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: {
                retry: false,
                diagnostics: "hook",
                onHookError,
                onResponse: () => {
                    throw thrown;
                },
            },
        });

        expect(warn).not.toHaveBeenCalled();
        expect(onHookError).toHaveBeenCalledTimes(1);
        const [name, error] = onHookError.mock.calls[0];
        expect(name).toBe("onResponse");
        // The observer receives the structured diagnostic: the raw thrown
        // value rides behind it as the cause.
        expect((error as Error).cause).toBe(thrown);
        warn.mockRestore();
    });

    test("silent mode still routes a real hook failure to a configured onHookError", async () => {
        // The diagnostics modes gate only the unsolicited fallback output —
        // never the consumer's own observer. A configured onHookError sees
        // real hook failures even in silent mode.
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const onHookError = vi.fn();
        const thrown = new Error("boom");

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: {
                retry: false,
                diagnostics: "silent",
                onHookError,
                onResponse: () => {
                    throw thrown;
                },
            },
        });

        expect(warn).not.toHaveBeenCalled();
        expect(onHookError).toHaveBeenCalledTimes(1);
        const [name, error] = onHookError.mock.calls[0];
        expect(name).toBe("onResponse");
        expect((error as Error).cause).toBe(thrown);
        warn.mockRestore();
    });

    test("rejects an invalid diagnostics value with a TypeError", async () => {
        await expect(
            sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options: {
                    diagnostics: "loud" as never,
                },
            })
        ).rejects.toThrow(TypeError);
    });
});
