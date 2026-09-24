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
const VALID_CODE_VERIFIER = "a".repeat(43);

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
        const url = new URL(
            buildMalAuthorizationUrl("client id", VALID_CODE_VERIFIER, "csrf state")
        );

        expect(url.searchParams.get("client_id")).toBe("client id");
        expect(url.searchParams.get("code_challenge")).toBe(VALID_CODE_VERIFIER);
        expect(url.searchParams.get("code_challenge_method")).toBe("plain");
        expect(url.searchParams.get("state")).toBe("csrf state");
    });

    test("rejects PKCE challenges outside MAL's verifier format", () => {
        expect(() => buildMalAuthorizationUrl("client-id", "too-short")).toThrow(TypeError);
        expect(() => buildMalAuthorizationUrl("client-id", `${"a".repeat(42)}+`)).toThrow(
            TypeError
        );
        expect(() => buildMalAuthorizationUrl("client-id", "a".repeat(129))).toThrow(TypeError);
    });

    test("rejects an invalid verifier before making a token request", async () => {
        await expect(
            getMalAccessToken({ clientId: "client-id", code: "auth-code", codeVerifier: "short" })
        ).rejects.toThrow(TypeError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("exchanges an authorization code as form-urlencoded data", async () => {
        await expect(
            getMalAccessToken({
                clientId: "client-id",
                code: "auth-code",
                codeVerifier: VALID_CODE_VERIFIER,
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
            code_verifier: VALID_CODE_VERIFIER,
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
            codeVerifier: VALID_CODE_VERIFIER,
            clientSecret: "secret",
            options: { retry: false },
        }).then(
            () => null,
            (error: unknown) => error
        );

        expect(outcome).toMatchObject({ name: "AniLinkRestError", status: 400 });
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

    test("performs exactly one HTTP call when the exchange fails with a 500", async () => {
        // The authorization code and PKCE verifier are single-use: a retry of
        // a failed exchange is guaranteed to fail again while doubling token
        // traffic, so the default policy must not retry.
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(500));

        await expect(
            getMalAccessToken({
                clientId: "client-id",
                code: "auth-code",
                codeVerifier: VALID_CODE_VERIFIER,
            })
        ).rejects.toMatchObject({ status: 500 });
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("rejects expires_in of 0 as an already-expired token", () => {
        // An expiry of "now" silently breaks proactive-refresh scheduling and
        // is one comparison-operator slip away from a refresh loop.
        expect(() =>
            getMalTokenExpiry({ access_token: "t", token_type: "Bearer", expires_in: 0 })
        ).toThrow(TypeError);
    });

    test("rejects negative, NaN, and Infinity lifetimes", () => {
        for (const expires_in of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
            expect(() =>
                getMalTokenExpiry({ access_token: "t", token_type: "Bearer", expires_in })
            ).toThrow(TypeError);
        }
    });
});
