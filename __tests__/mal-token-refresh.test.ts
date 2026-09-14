import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLink } from "../src/AniLink";
import { AniLinkApiError, AniLinkAuthError, AniLinkRestError } from "../src/base/AniLinkError";
import { resolveMalCredentials } from "../src/base/credentials";
import { type MalTokenResponse } from "../src/apis/rest/mal/auth";
import { MAL_TOKEN_URL } from "../src/apis/rest/mal/constants";
import { buildRefreshedAuth } from "../src/apis/rest/mal/tokenRefresh";
import { buildMyAnimeListApi } from "../src/apis/rest/mal/wiring";
import { getAxiosStub, makeAxiosResponseError } from "./helpers/axiosStub";

/**
 * MAL automatic token-refresh lifecycle suite.
 *
 * With `refreshToken` and `clientId` configured, the wiring seam intercepts
 * 401 responses, exchanges the refresh token once, swaps the stored auth
 * material on the operation instances, and replays the original request a
 * single time. Without refresh credentials, a 401 surfaces unchanged.
 */

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build({ data: { id: 21, title: "Fullmetal Alchemist" } });
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

/** The Axios config captured from one recorded request call. */
interface CapturedAxiosConfig {
    url: string;
    method: string;
    data?: unknown;
    headers: Record<string, string>;
}

const configAt = (index: number): CapturedAxiosConfig =>
    mocks.request.mock.calls[index]?.[0] as CapturedAxiosConfig;

const tokenEndpointCalls = (): CapturedAxiosConfig[] =>
    mocks.request.mock.calls
        .map((call) => call[0] as CapturedAxiosConfig)
        .filter((config) => config.url === MAL_TOKEN_URL);

const formField = (config: CapturedAxiosConfig, field: string): string | null =>
    new URLSearchParams(String(config.data)).get(field);

/** Builds a MAL token response body with sensible defaults. */
const tokenResponse = (overrides: Partial<MalTokenResponse> = {}): MalTokenResponse => ({
    access_token: "fresh-access-token",
    token_type: "Bearer",
    expires_in: 2_417_200,
    refresh_token: "rotated-refresh-token",
    ...overrides,
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe("MAL automatic token refresh", () => {
    test("refreshes on 401, replays the original request with the new bearer token, and returns the replay body", async () => {
        const onTokenRefresh = vi.fn();
        const api = buildMyAnimeListApi({
            accessToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
            onTokenRefresh,
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await expect(api.user.me()).resolves.toEqual({
            id: 21,
            title: "Fullmetal Alchemist",
        });

        expect(mocks.request).toHaveBeenCalledTimes(3);

        const refreshConfig = configAt(1);
        expect(refreshConfig.url).toBe(MAL_TOKEN_URL);
        expect(refreshConfig.method).toBe("POST");
        expect(refreshConfig.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
        expect(formField(refreshConfig, "grant_type")).toBe("refresh_token");
        expect(formField(refreshConfig, "client_id")).toBe("mal-client-id");
        expect(formField(refreshConfig, "refresh_token")).toBe("stored-refresh-token");
        expect(formField(refreshConfig, "client_secret")).toBeNull();

        const replayConfig = configAt(2);
        expect(replayConfig.url).toBe("https://api.myanimelist.net/v2/users/@me");
        expect(replayConfig.headers.Authorization).toBe("Bearer fresh-access-token");
        expect(onTokenRefresh).toHaveBeenCalledTimes(1);
        expect(onTokenRefresh).toHaveBeenCalledWith(tokenResponse());
    });

    test("sends the client secret on the refresh grant when one is configured", async () => {
        const api = buildMyAnimeListApi({
            accessToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
            clientSecret: "mal-client-secret",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await api.user.me();

        expect(formField(configAt(1), "client_secret")).toBe("mal-client-secret");
    });

    test("keeps the stored refresh token when the refresh response omits one (rotation semantics)", async () => {
        const api = buildMyAnimeListApi({
            accessToken: "expired-access-token",
            refreshToken: "original-refresh-token",
            clientId: "mal-client-id",
        });

        // First cycle: the refresh response omits refresh_token.
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse({ refresh_token: undefined }) });
        await api.user.me();
        expect(configAt(2).headers.Authorization).toBe("Bearer fresh-access-token");

        // Second cycle: the stored refresh token is still the original one.
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({
            data: tokenResponse({ access_token: "second-access-token" }),
        });
        await api.user.me();

        expect(mocks.request).toHaveBeenCalledTimes(6);
        expect(formField(configAt(4), "refresh_token")).toBe("original-refresh-token");
        expect(configAt(5).headers.Authorization).toBe("Bearer second-access-token");
    });

    test("deduplicates concurrent 401s into a single refresh call", async () => {
        const api = buildMyAnimeListApi({
            accessToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        const [user, anime] = await Promise.all([api.user.me(), api.anime.get({ id: 21 })]);

        expect(user).toEqual({ id: 21, title: "Fullmetal Alchemist" });
        expect(anime).toEqual({ id: 21, title: "Fullmetal Alchemist" });
        expect(mocks.request).toHaveBeenCalledTimes(5);
        expect(tokenEndpointCalls()).toHaveLength(1);
        expect(configAt(3).headers.Authorization).toBe("Bearer fresh-access-token");
        expect(configAt(4).headers.Authorization).toBe("Bearer fresh-access-token");
    });

    test("invokes onTokenRefresh exactly once per refresh grant under concurrent 401s", async () => {
        const onTokenRefresh = vi.fn();
        const api = buildMyAnimeListApi({
            accessToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
            onTokenRefresh,
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await Promise.all([api.user.me(), api.anime.get({ id: 21 })]);

        expect(tokenEndpointCalls()).toHaveLength(1);
        expect(onTokenRefresh).toHaveBeenCalledTimes(1);
        expect(onTokenRefresh).toHaveBeenCalledWith(tokenResponse());
    });

    test("still replays the request when onTokenRefresh throws, reporting the failure to onHookError", async () => {
        const onHookError = vi.fn();
        const onTokenRefresh = vi.fn(() => {
            throw new Error("persistence failed");
        });
        const api = buildMyAnimeListApi({
            accessToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
            onTokenRefresh,
            onHookError,
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await expect(api.user.me()).resolves.toEqual({
            id: 21,
            title: "Fullmetal Alchemist",
        });

        expect(mocks.request).toHaveBeenCalledTimes(3);
        expect(onTokenRefresh).toHaveBeenCalledTimes(1);
        expect(onHookError).toHaveBeenCalledTimes(1);
        expect(onHookError).toHaveBeenCalledWith(
            "onTokenRefresh",
            expect.objectContaining({ message: "persistence failed" })
        );
    });

    test("does not send the X-MAL-CLIENT-ID header on the replayed request when a bearer token is present", async () => {
        const api = buildMyAnimeListApi({
            accessToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await api.user.me();

        const replayConfig = configAt(2);
        expect(replayConfig.headers.Authorization).toBe("Bearer fresh-access-token");
        // The client-ID header is only for client-ID-only access to public
        // endpoints; with a bearer token it would only widen client-ID
        // exposure to intermediaries that log request headers.
        expect(replayConfig.headers["X-MAL-CLIENT-ID"]).toBeUndefined();
    });

    test("bootstraps from a missing access token: AniLinkAuthError triggers one refresh, then the request runs with the new token", async () => {
        const onTokenRefresh = vi.fn();
        const api = buildMyAnimeListApi({
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
            onTokenRefresh,
        });

        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await expect(api.user.me()).resolves.toEqual({
            id: 21,
            title: "Fullmetal Alchemist",
        });

        expect(mocks.request).toHaveBeenCalledTimes(2);
        expect(tokenEndpointCalls()).toHaveLength(1);
        expect(configAt(1).headers.Authorization).toBe("Bearer fresh-access-token");
        expect(onTokenRefresh).toHaveBeenCalledTimes(1);
    });

    test("surfaces the sanitized refresh error when bootstrapping without an access token and the grant fails", async () => {
        const api = buildMyAnimeListApi({
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(400));

        await expect(api.user.me()).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof AniLinkApiError &&
                error.status === 400 &&
                error.message.includes("MAL token request")
        );

        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("does not bootstrap without an access token when refresh credentials are absent", async () => {
        const api = buildMyAnimeListApi({});

        await expect(api.user.me()).rejects.toBeInstanceOf(AniLinkAuthError);

        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("surfaces the replayed 401 when the replay also fails — no retry loop", async () => {
        const api = buildMyAnimeListApi({
            accessToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));

        await expect(api.user.me()).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkRestError && error.status === 401
        );

        expect(mocks.request).toHaveBeenCalledTimes(3);
        expect(tokenEndpointCalls()).toHaveLength(1);
    });

    test("surfaces the sanitized refresh error and does not replay when the token endpoint fails", async () => {
        const api = buildMyAnimeListApi({
            accessToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(400));

        await expect(api.user.me()).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof AniLinkApiError &&
                error.status === 400 &&
                error.message.includes("MAL token request")
        );

        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("passes non-401 failures through without refreshing", async () => {
        const api = buildMyAnimeListApi({
            accessToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "mal-client-id",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(404));

        await expect(api.user.me()).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkRestError && error.status === 404
        );

        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(tokenEndpointCalls()).toHaveLength(0);
    });

    test("does not refresh on 401 when no refresh token is configured", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));

        await expect(api.user.me()).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkRestError && error.status === 401
        );

        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(tokenEndpointCalls()).toHaveLength(0);
    });

    test("does not refresh on 401 when the client ID is missing", async () => {
        const api = buildMyAnimeListApi({
            accessToken: "mal-access-token",
            refreshToken: "stored-refresh-token",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));

        await expect(api.user.me()).rejects.toBeInstanceOf(AniLinkRestError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("does not activate the refresh lifecycle when the refresh token is an empty string", async () => {
        const api = buildMyAnimeListApi({
            accessToken: "mal-access-token",
            refreshToken: "",
            clientId: "mal-client-id",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));

        await expect(api.user.me()).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkRestError && error.status === 401
        );

        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(tokenEndpointCalls()).toHaveLength(0);
    });

    test("does not activate the refresh lifecycle when the refresh credentials are whitespace-only", async () => {
        // A whitespace-only value must be treated as missing, exactly like the
        // empty string: otherwise every 401 performs a doomed refresh grant
        // before replaying.
        const api = buildMyAnimeListApi({
            accessToken: "mal-access-token",
            refreshToken: "   ",
            clientId: "   ",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));

        await expect(api.user.me()).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkRestError && error.status === 401
        );

        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(tokenEndpointCalls()).toHaveLength(0);
    });

    test("pins the AniLinkRestError extends AniLinkApiError inheritance the refresh classifier relies on", () => {
        // The 401 classifier in MalTokenRefresher matches on AniLinkApiError;
        // MAL 401s are normalized to AniLinkRestError. If this inheritance is
        // ever restructured, this test fails before the refresh lifecycle
        // silently stops triggering.
        const restError = new AniLinkRestError(401, { error: "invalid_token" });
        expect(restError).toBeInstanceOf(AniLinkApiError);
        expect(restError.status).toBe(401);
    });

    test("buildRefreshedAuth preserves non-client-ID headers and drops X-MAL-CLIENT-ID", () => {
        // The replayed request authenticates with the bearer token; the
        // client-ID header is only for client-ID-only public access, and a
        // stale one would widen client-ID exposure to header-logging
        // intermediaries (mirroring resolveMalCredentials).
        expect(
            buildRefreshedAuth(
                {
                    token: "old",
                    headers: { "X-MAL-CLIENT-ID": "mal-client-id", "X-Other": "kept" },
                },
                "new"
            )
        ).toEqual({ token: "new", headers: { "X-Other": "kept" } });
        // A headers object containing only the client-ID header collapses to
        // no headers at all.
        expect(
            buildRefreshedAuth(
                { token: "old", headers: { "X-MAL-CLIENT-ID": "mal-client-id" } },
                "new"
            )
        ).toEqual({ token: "new", headers: undefined });
        expect(buildRefreshedAuth(undefined, "new")).toEqual({ token: "new", headers: undefined });
        expect(buildRefreshedAuth("plain-token", "new")).toEqual({
            token: "new",
            headers: undefined,
        });
    });

    test("resolveMalCredentials strips onTokenRefresh from the shared transport options", () => {
        expect(
            resolveMalCredentials({
                accessToken: "mal-token",
                refreshToken: "stored-refresh-token",
                clientId: "mal-client-id",
                clientSecret: "mal-client-secret",
                onTokenRefresh: vi.fn(),
                timeout: 5_000,
            })
        ).toEqual({
            // The client-ID header is suppressed when a bearer token is
            // present: it is only for client-ID-only access to public
            // endpoints.
            auth: { token: "mal-token", headers: undefined },
            options: { timeout: 5_000 },
        });
    });

    test("refreshes through the composed AniLink client constructed with mal credentials", async () => {
        const onTokenRefresh = vi.fn();
        const aniLink = new AniLink({
            mal: {
                accessToken: "expired-access-token",
                refreshToken: "stored-refresh-token",
                clientId: "mal-client-id",
                onTokenRefresh,
            },
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await expect(aniLink.mal.user.me()).resolves.toEqual({
            id: 21,
            title: "Fullmetal Alchemist",
        });

        expect(mocks.request).toHaveBeenCalledTimes(3);
        expect(configAt(2).headers.Authorization).toBe("Bearer fresh-access-token");
        expect(onTokenRefresh).toHaveBeenCalledWith(tokenResponse());
    });
});
