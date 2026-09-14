import { beforeEach, describe, expect, test, vi } from "vitest";
import {
    ANILIST_AUTHORIZE_URL,
    ANILIST_TOKEN_URL,
    buildAuthorizationUrl,
    getAccessToken,
    getTokenExpiry,
    refreshAccessToken,
} from "../src/apis/graphql/anilist/auth";
import {
    AniLinkApiError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
    AniLinkValidationError,
} from "../src/base/AniLinkError";

const mocks = vi.hoisted(() => {
    /** The Axios request config the token pipeline builds; captured per call. */
    interface CapturedTokenConfig {
        url?: string;
        method?: string;
        data?: unknown;
        headers?: Record<string, string>;
        timeout?: number;
        signal?: AbortSignal;
    }

    /** The token-endpoint response shape; `refresh_token` may be absent. */
    interface TokenResponseData {
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token?: string;
    }

    const request = vi.fn(
        async (_config: CapturedTokenConfig): Promise<{ data: TokenResponseData }> => ({
            data: {
                access_token: "new-access-token",
                token_type: "Bearer",
                expires_in: 31536000,
                refresh_token: "new-refresh-token",
            },
        })
    );
    const create = vi.fn(() => request);
    const isAxiosError = vi.fn((error: unknown) =>
        Boolean((error as { isAxiosError?: boolean } | null)?.isAxiosError)
    );
    const isCancel = vi.fn((error: unknown) =>
        Boolean((error as { isCanceled?: boolean } | null)?.isCanceled)
    );

    return { request, create, isAxiosError, isCancel };
});

vi.mock("axios", () => ({
    __esModule: true,
    default: Object.assign(vi.fn(), {
        create: mocks.create,
        isAxiosError: mocks.isAxiosError,
        isCancel: mocks.isCancel,
    }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("buildAuthorizationUrl", () => {
    test("builds the authorize URL with client id, redirect uri, and response type", () => {
        const url = buildAuthorizationUrl("1234", "https://example.com/callback");

        expect(url).toBe(
            `${ANILIST_AUTHORIZE_URL}?client_id=1234&redirect_uri=${encodeURIComponent(
                "https://example.com/callback"
            )}&response_type=code`
        );
    });

    test("encodes special characters in query parameters", () => {
        const url = buildAuthorizationUrl("client with spaces", "https://example.com/cb?a=1&b=2");

        expect(url).toContain("client_id=client%20with%20spaces");
        expect(url).toContain(
            `redirect_uri=${encodeURIComponent("https://example.com/cb?a=1&b=2")}`
        );
        expect(url).toContain("response_type=code");
    });

    test("appends an encoded state parameter when provided", () => {
        const url = buildAuthorizationUrl("1234", "https://example.com/callback", "st ate&x=1");

        expect(url).toContain(`state=${encodeURIComponent("st ate&x=1")}`);

        // Round-trip: the state read back from the redirect query matches.
        const query = new URL(url).searchParams;
        expect(query.get("state")).toBe("st ate&x=1");
    });

    test("round-trips a state value containing query metacharacters unchanged", () => {
        const url = buildAuthorizationUrl("1234", "https://example.com/callback", "abc&x=1");

        // The raw ampersand must be encoded so it cannot inject extra
        // parameters into the authorize URL.
        expect(url).not.toMatch(/state=abc&x=1/);
        expect(url).toContain(`state=${encodeURIComponent("abc&x=1")}`);

        const query = new URL(url).searchParams;
        expect(query.get("state")).toBe("abc&x=1");
        expect(Object.keys(Object.fromEntries(new URL(url).searchParams))).not.toContain("x");
    });

    test("omits the state parameter when not provided", () => {
        const url = buildAuthorizationUrl("1234", "https://example.com/callback");

        expect(url).not.toContain("state=");
    });
});

describe("getAccessToken", () => {
    test("exchanges an authorization code via the shared pipeline to the token endpoint", async () => {
        const result = await getAccessToken("client-id", "client-secret", "auth-code");

        expect(mocks.request).toHaveBeenCalledTimes(1);
        const [config] = mocks.request.mock.calls[0];
        expect(config.url).toBe(ANILIST_TOKEN_URL);
        expect(config.method).toBe("POST");
        expect(config.data).toBe(
            new URLSearchParams({
                grant_type: "authorization_code",
                client_id: "client-id",
                client_secret: "client-secret",
                code: "auth-code",
            }).toString()
        );
        expect(config.headers?.["Content-Type"]).toBe("application/x-www-form-urlencoded");
        expect(config.timeout).toBe(10000);
        expect(result).toEqual({
            access_token: "new-access-token",
            token_type: "Bearer",
            expires_in: 31536000,
            refresh_token: "new-refresh-token",
        });
    });

    test("omits the redirect_uri key entirely when no redirect URI is provided", async () => {
        await getAccessToken("client-id", "client-secret", "auth-code");

        const [config] = mocks.request.mock.calls[0];
        // An empty-string value can be rejected as a mismatch against the
        // registered URI; the field must be absent, not present-but-empty.
        expect(config.data).not.toContain("redirect_uri=");
    });

    test("treats a blank redirect URI as omitted", async () => {
        await getAccessToken("client-id", "client-secret", "auth-code", "");

        const [config] = mocks.request.mock.calls[0];
        // A whitespace-only value is as unusable as an empty string: the
        // field must be absent, not present-but-blank.
        expect(config.data).not.toContain("redirect_uri=");
    });

    test("opts back into retries through the options parameter", async () => {
        // The default is no retry (single-use grant credentials); a caller
        // with a retryable transport (for example a flaky proxy) opts back in
        // with an explicit policy.
        mocks.request
            .mockRejectedValueOnce({ isAxiosError: true, code: "ECONNREFUSED" })
            .mockResolvedValueOnce({
                data: {
                    access_token: "new-access-token",
                    token_type: "Bearer",
                    expires_in: 31536000,
                    refresh_token: "new-refresh-token",
                },
            });

        const result = await getAccessToken(
            "client-id",
            "client-secret",
            "auth-code",
            undefined,
            undefined,
            { retry: { maxRetries: 1, retryOnNetworkError: true } }
        );

        expect(result.access_token).toBe("new-access-token");
        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("includes the redirect uri when provided", async () => {
        await getAccessToken("client-id", "client-secret", "auth-code", "https://example.com/cb");

        const [config] = mocks.request.mock.calls[0];
        expect(config.data).toContain(
            `redirect_uri=${encodeURIComponent("https://example.com/cb")}`
        );
    });

    test("forwards an AbortSignal through the shared pipeline", async () => {
        const controller = new AbortController();

        await getAccessToken(
            "client-id",
            "client-secret",
            "auth-code",
            undefined,
            controller.signal
        );

        const [config] = mocks.request.mock.calls[0];
        expect(config.signal).toBe(controller.signal);
    });
});

describe("refreshAccessToken", () => {
    test("posts a refresh_token grant to the token endpoint", async () => {
        const result = await refreshAccessToken("client-id", "client-secret", "refresh-token");

        expect(mocks.request).toHaveBeenCalledTimes(1);
        const [config] = mocks.request.mock.calls[0];
        expect(config.url).toBe(ANILIST_TOKEN_URL);
        expect(config.data).toBe(
            new URLSearchParams({
                grant_type: "refresh_token",
                client_id: "client-id",
                client_secret: "client-secret",
                refresh_token: "refresh-token",
            }).toString()
        );
        expect(result.access_token).toBe("new-access-token");
    });

    test("tolerates a refresh response without a refresh token", async () => {
        mocks.request.mockResolvedValueOnce({
            data: {
                access_token: "rotated-access-token",
                token_type: "Bearer",
                expires_in: 31536000,
            },
        });

        const result = await refreshAccessToken("client-id", "client-secret", "refresh-token");

        expect(result.access_token).toBe("rotated-access-token");
        expect(result.refresh_token).toBeUndefined();
    });
});

describe("token request failure normalization", () => {
    test("maps a 400 OAuth rejection to AniLinkApiError without leaking secrets", async () => {
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            config: {
                data: new URLSearchParams({
                    grant_type: "authorization_code",
                    client_id: "client-id",
                    client_secret: "super-secret",
                    code: "auth-code",
                }).toString(),
            },
            response: {
                status: 400,
                data: { error: "invalid_grant", error_description: "Invalid authorization code." },
            },
        });

        const error = await getAccessToken("client-id", "super-secret", "auth-code").catch(
            (caught: unknown) => caught
        );

        expect(error).toBeInstanceOf(AniLinkApiError);
        const apiError = error as AniLinkApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe(AniLinkErrorCodes.API);
        expect(apiError.data).toEqual({
            error: "invalid_grant",
            error_description: "Invalid authorization code.",
        });
        expect(apiError.message).toContain("AniList token request failed with status 400");
        expect(apiError.rawAxiosError).toBeUndefined();

        // The safe message carries no credential material.
        for (const secret of ["client_secret", "super-secret", "auth-code", "refresh_token"]) {
            expect(apiError.message).not.toContain(secret);
        }

        // The serialized error carries no credential material either.
        const serialized = JSON.stringify(apiError);
        expect(serialized).not.toContain("super-secret");
        expect(serialized).not.toContain("auth-code");
    });

    test("maps a 401 rejection to AniLinkApiError with the upstream body", async () => {
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 401, data: { error: "unauthorized" } },
        });

        const error = await refreshAccessToken("client-id", "client-secret", "refresh-token").catch(
            (caught: unknown) => caught
        );

        expect(error).toBeInstanceOf(AniLinkApiError);
        const apiError = error as AniLinkApiError;
        expect(apiError.status).toBe(401);
        expect(apiError.code).toBe(AniLinkErrorCodes.API);
        expect(apiError.data).toEqual({ error: "unauthorized" });
    });

    test("maps a network-level rejection to AniLinkNetworkError with a stable code", async () => {
        // Token requests default to no retry (single-use credentials), so a
        // network failure surfaces after exactly one attempt.
        mocks.request.mockRejectedValueOnce({ isAxiosError: true, code: "ECONNREFUSED" });

        await expect(
            refreshAccessToken("client-id", "client-secret", "refresh-token")
        ).rejects.toBeInstanceOf(AniLinkNetworkError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("performs exactly one HTTP call when the exchange fails with a 500", async () => {
        // The authorization code is single-use: a retry of a failed exchange
        // is guaranteed to fail again while doubling token traffic, so the
        // default policy must not retry.
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 500, data: { error: "server_error" } },
        });

        await expect(
            getAccessToken("client-id", "client-secret", "auth-code")
        ).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("maps a timeout rejection to the TIMEOUT_ERROR code", async () => {
        mocks.request.mockRejectedValueOnce({ isAxiosError: true, code: "ECONNABORTED" });

        await expect(
            getAccessToken("client-id", "client-secret", "auth-code")
        ).rejects.toMatchObject({ code: AniLinkErrorCodes.TIMEOUT });
    });

    test("does not retry an OAuth rejection even under the default retry policy", async () => {
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 400, data: { error: "invalid_grant" } },
        });

        await expect(
            getAccessToken("client-id", "client-secret", "auth-code")
        ).rejects.toBeInstanceOf(AniLinkApiError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });
    test("surfaces a cancelled token request as a sanitized AniLinkError", async () => {
        mocks.request.mockRejectedValueOnce({ isCanceled: true });

        const error = await getAccessToken("client-id", "client-secret", "auth-code").catch(
            (caught: unknown) => caught
        );

        // Cancellations are normalized by the shared pipeline before the auth
        // layer sees them; the surfaced error must stay sanitized either way.
        expect(error).toBeInstanceOf(AniLinkError);
    });

    test("passes an already-normalized AniLinkError through without rewrapping", async () => {
        // Validation failures are not retried by the default policy, so the
        // rejection reaches the auth normalization directly.
        const original = new AniLinkValidationError(["field is required"]);
        mocks.request.mockRejectedValueOnce(original);

        const error = await getAccessToken("client-id", "client-secret", "auth-code").catch(
            (caught: unknown) => caught
        );

        expect(error).toBe(original);
    });

    test("wraps an unknown rejection in a generic AniLinkError", async () => {
        mocks.request.mockRejectedValueOnce(new Error("something unexpected"));

        const error = await getAccessToken("client-id", "client-secret", "auth-code").catch(
            (caught: unknown) => caught
        );

        expect(error).toBeInstanceOf(AniLinkError);
        expect(error).not.toBeInstanceOf(AniLinkApiError);
        expect(error).not.toBeInstanceOf(AniLinkNetworkError);
        // The pipeline already sanitized the raw failure; the auth layer must
        // not rewrap it into something less specific.
        expect((error as AniLinkError).code).toBe(AniLinkErrorCodes.UNKNOWN);
    });
});

describe("getTokenExpiry", () => {
    test("adds expires_in seconds to the provided now", () => {
        const expiry = getTokenExpiry(
            { access_token: "t", token_type: "Bearer", expires_in: 3600 },
            1_000_000
        );

        expect(expiry.getTime()).toBe(1_000_000 + 3_600_000);
    });

    test("defaults to the current time", () => {
        vi.useFakeTimers();
        try {
            vi.setSystemTime(50_000_000);

            const expiry = getTokenExpiry({
                access_token: "t",
                token_type: "Bearer",
                expires_in: 60,
            });

            expect(expiry.getTime()).toBe(50_000_000 + 60_000);
        } finally {
            vi.useRealTimers();
        }
    });

    test("rejects expires_in of 0 as an already-expired token", () => {
        // An expiry of "now" silently breaks proactive-refresh scheduling and
        // is one comparison-operator slip away from a refresh loop.
        expect(() =>
            getTokenExpiry({ access_token: "t", token_type: "Bearer", expires_in: 0 })
        ).toThrow(TypeError);
    });

    test("rejects negative, NaN, and Infinity lifetimes", () => {
        for (const expires_in of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
            expect(() =>
                getTokenExpiry({ access_token: "t", token_type: "Bearer", expires_in })
            ).toThrow(TypeError);
        }
    });
});
