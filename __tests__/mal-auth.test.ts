import { beforeEach, describe, expect, test, vi } from "vitest";
import {
    buildMalAuthorizationUrl,
    getMalAccessToken,
    getMalTokenExpiry,
    refreshMalAccessToken,
} from "../src/apis/rest/mal/auth";
import { getAxiosStub, makeAxiosResponseError } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build({
        data: {
            access_token: "access-token",
            token_type: "Bearer",
            expires_in: 3_600,
            refresh_token: "refresh-token",
        },
    });
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

interface CapturedAxiosConfig {
    url: string;
    method: string;
    data?: unknown;
    headers: Record<string, string>;
}

const lastConfig = (): CapturedAxiosConfig =>
    mocks.request.mock.calls.at(-1)?.[0] as CapturedAxiosConfig;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("MyAnimeList OAuth2 PKCE helpers", () => {
    test("builds an authorization URL with encoded PKCE and state parameters", () => {
        expect(buildMalAuthorizationUrl("client id", "challenge/value", "csrf state")).toBe(
            "https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=client%20id&code_challenge=challenge%2Fvalue&code_challenge_method=S256&state=csrf%20state"
        );
    });

    test("exchanges an authorization code as form-urlencoded data", async () => {
        await expect(
            getMalAccessToken({
                clientId: "client-id",
                code: "auth-code",
                codeVerifier: "verifier",
                options: { retry: false },
            })
        ).resolves.toMatchObject({ access_token: "access-token" });

        const config = lastConfig();
        expect(config.url).toBe("https://myanimelist.net/v1/oauth2/token");
        expect(config.method).toBe("POST");
        expect(config.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
        expect(Object.fromEntries(new URLSearchParams(String(config.data)))).toEqual({
            client_id: "client-id",
            code: "auth-code",
            code_verifier: "verifier",
            grant_type: "authorization_code",
        });
    });

    test("refreshes a MAL access token without exposing the refresh token in headers", async () => {
        await refreshMalAccessToken({
            clientId: "client-id",
            refreshToken: "refresh-token",
            options: { retry: false },
        });

        const config = lastConfig();
        expect(Object.fromEntries(new URLSearchParams(String(config.data)))).toEqual({
            client_id: "client-id",
            grant_type: "refresh_token",
            refresh_token: "refresh-token",
        });
        expect(config.headers.Authorization).toBeUndefined();
    });

    test("sanitizes token endpoint failures while preserving the upstream status", async () => {
        mocks.request.mockRejectedValueOnce(
            makeAxiosResponseError(400, {}, { error: "invalid_grant" })
        );

        const outcome = await getMalAccessToken({
            clientId: "client-id",
            code: "bad-code",
            codeVerifier: "verifier",
            clientSecret: "secret",
            options: { retry: false },
        }).then(
            () => null,
            (error: unknown) => error
        );

        expect(outcome).toMatchObject({ name: "AniLinkApiError", status: 400 });
        expect((outcome as { rawAxiosError?: unknown }).rawAxiosError).toBeUndefined();
    });

    test("computes absolute expiry from the MAL token lifetime", () => {
        expect(
            getMalTokenExpiry(
                { access_token: "token", token_type: "Bearer", expires_in: 60 },
                1_000
            )
        ).toEqual(new Date(61_000));
    });
});
