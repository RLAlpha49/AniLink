import { beforeEach, describe, expect, test, vi } from "vitest";
import {
    ANILIST_AUTHORIZE_URL,
    ANILIST_TOKEN_URL,
    buildAuthorizationUrl,
    getAccessToken,
    refreshAccessToken,
} from "../src/auth/AniListAuth";

const mocks = vi.hoisted(() => ({
    post: vi.fn(async () => ({
        data: {
            access_token: "new-access-token",
            token_type: "Bearer",
            expires_in: 31536000,
            refresh_token: "new-refresh-token",
        },
    })),
}));

vi.mock("axios", () => ({
    __esModule: true,
    default: { post: mocks.post },
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
});

describe("getAccessToken", () => {
    test("exchanges an authorization code via a form-encoded POST to the token endpoint", async () => {
        const result = await getAccessToken("client-id", "client-secret", "auth-code");

        expect(mocks.post).toHaveBeenCalledTimes(1);
        const [url, body, config] = mocks.post.mock.calls[0];
        expect(url).toBe(ANILIST_TOKEN_URL);
        expect(body).toBe(
            new URLSearchParams({
                grant_type: "authorization_code",
                client_id: "client-id",
                client_secret: "client-secret",
                redirect_uri: "",
                code: "auth-code",
            }).toString()
        );
        expect(config?.headers?.["Content-Type"]).toBe("application/x-www-form-urlencoded");
        expect(result).toEqual({
            access_token: "new-access-token",
            token_type: "Bearer",
            expires_in: 31536000,
            refresh_token: "new-refresh-token",
        });
    });

    test("includes the redirect uri when provided", async () => {
        await getAccessToken("client-id", "client-secret", "auth-code", "https://example.com/cb");

        const [, body] = mocks.post.mock.calls[0];
        expect(body).toContain(`redirect_uri=${encodeURIComponent("https://example.com/cb")}`);
    });
});

describe("refreshAccessToken", () => {
    test("posts a refresh_token grant to the token endpoint", async () => {
        const result = await refreshAccessToken("client-id", "client-secret", "refresh-token");

        expect(mocks.post).toHaveBeenCalledTimes(1);
        const [url, body] = mocks.post.mock.calls[0];
        expect(url).toBe(ANILIST_TOKEN_URL);
        expect(body).toBe(
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
        mocks.post.mockResolvedValueOnce({
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
