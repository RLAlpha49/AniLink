import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLink } from "../src/AniLink";
import { AniLinkApiError, AniLinkAuthError, AniLinkGraphQLError } from "../src/base/AniLinkError";
import { resolveAniListCredentials } from "../src/base/credentials";
import { type AniListTokenResponse } from "../src/apis/graphql/anilist/auth";
import { ANILIST_GRAPHQL_URL } from "../src/apis/graphql/anilist/AniListOperation";
import { ANILIST_TOKEN_URL } from "../src/apis/graphql/anilist/auth";
import { buildRefreshedAuth } from "../src/apis/graphql/anilist/tokenRefresh";
import { buildAniListApi } from "../src/apis/graphql/anilist/facade";
import { getAxiosStub, makeAxiosResponseError } from "./helpers/axiosStub";

/**
 * AniList automatic token-refresh lifecycle suite.
 *
 * With `refreshToken`, `clientId`, and `clientSecret` configured, the wiring
 * seam intercepts 401 responses (HTTP-level or GraphQL-envelope-level),
 * exchanges the refresh token once, swaps the auth material on the operation
 * instances, and replays the original request a single time. Without the
 * full refresh credential set, a 401 surfaces unchanged.
 */

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build({ data: { data: { Media: { id: 1 } } } });
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
        .filter((config) => config.url === ANILIST_TOKEN_URL);

const formField = (config: CapturedAxiosConfig, field: string): string | null =>
    new URLSearchParams(String(config.data)).get(field);

/** Builds an AniList token response body with sensible defaults. */
const tokenResponse = (overrides: Partial<AniListTokenResponse> = {}): AniListTokenResponse => ({
    access_token: "fresh-access-token",
    token_type: "Bearer",
    expires_in: 3_153_600,
    refresh_token: "rotated-refresh-token",
    ...overrides,
});

/** A GraphQL-envelope 401: HTTP 200 with an errors entry carrying status 401. */
const graphQlUnauthorizedEnvelope = (): { status: number; data: unknown } => ({
    status: 200,
    data: {
        data: null,
        errors: [{ message: "Not Authenticated", status: 401 }],
    },
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe("AniList automatic token refresh", () => {
    test("refreshes on HTTP 401, replays the original request with the new bearer token, and returns the replay body", async () => {
        const onTokenRefresh = vi.fn();
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
            onTokenRefresh,
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await expect(api.query.media({ id: 1, type: "ANIME" })).resolves.toEqual({ id: 1 });

        expect(mocks.request).toHaveBeenCalledTimes(3);

        const refreshConfig = configAt(1);
        expect(refreshConfig.url).toBe(ANILIST_TOKEN_URL);
        expect(refreshConfig.method).toBe("POST");
        expect(refreshConfig.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
        expect(formField(refreshConfig, "grant_type")).toBe("refresh_token");
        expect(formField(refreshConfig, "client_id")).toBe("anilist-client-id");
        expect(formField(refreshConfig, "client_secret")).toBe("anilist-client-secret");
        expect(formField(refreshConfig, "refresh_token")).toBe("stored-refresh-token");

        const replayConfig = configAt(2);
        expect(replayConfig.url).toBe(ANILIST_GRAPHQL_URL);
        expect(replayConfig.headers.Authorization).toBe("Bearer fresh-access-token");
        expect(onTokenRefresh).toHaveBeenCalledTimes(1);
        expect(onTokenRefresh).toHaveBeenCalledWith(tokenResponse());
    });

    test("refreshes on a GraphQL-envelope 401 (HTTP 200 with an errors entry carrying status 401)", async () => {
        // AniList frequently reports an expired token inside an HTTP 200
        // envelope with a GraphQL errors entry carrying `status: 401`. The
        // refresher classifies through AniLinkGraphQLError.status, which
        // reflects the upstream GraphQL error status — this test pins that
        // the lifecycle actually fires for the envelope form, not just the
        // HTTP-level 401.
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
        });

        mocks.request.mockResolvedValueOnce(graphQlUnauthorizedEnvelope());
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await expect(api.query.media({ id: 1, type: "ANIME" })).resolves.toEqual({ id: 1 });

        expect(tokenEndpointCalls()).toHaveLength(1);
        expect(configAt(2).headers.Authorization).toBe("Bearer fresh-access-token");
    });

    test("keeps the stored refresh token when the refresh response omits one (rotation semantics)", async () => {
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "original-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
        });

        // First cycle: the refresh response omits refresh_token.
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse({ refresh_token: undefined }) });
        await api.query.media({ id: 1, type: "ANIME" });
        expect(configAt(2).headers.Authorization).toBe("Bearer fresh-access-token");

        // Second cycle: the stored refresh token is still the original one.
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({
            data: tokenResponse({ access_token: "second-access-token" }),
        });
        await api.query.media({ id: 1, type: "ANIME" });

        expect(mocks.request).toHaveBeenCalledTimes(6);
        expect(formField(configAt(4), "refresh_token")).toBe("original-refresh-token");
        expect(configAt(5).headers.Authorization).toBe("Bearer second-access-token");
    });

    test("deduplicates concurrent 401s into a single refresh call", async () => {
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        const [first, second] = await Promise.all([
            api.query.media({ id: 1, type: "ANIME" }),
            api.query.media({ id: 2, type: "ANIME" }),
        ]);

        expect(first).toEqual({ id: 1 });
        expect(second).toEqual({ id: 1 });
        expect(tokenEndpointCalls()).toHaveLength(1);
        expect(configAt(3).headers.Authorization).toBe("Bearer fresh-access-token");
        expect(configAt(4).headers.Authorization).toBe("Bearer fresh-access-token");
    });

    test("invokes onTokenRefresh exactly once per refresh grant under concurrent 401s", async () => {
        const onTokenRefresh = vi.fn();
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
            onTokenRefresh,
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await Promise.all([
            api.query.media({ id: 1, type: "ANIME" }),
            api.query.media({ id: 2, type: "ANIME" }),
        ]);

        expect(tokenEndpointCalls()).toHaveLength(1);
        expect(onTokenRefresh).toHaveBeenCalledTimes(1);
        expect(onTokenRefresh).toHaveBeenCalledWith(tokenResponse());
    });

    test("still replays the request when onTokenRefresh throws, reporting the failure to onHookError", async () => {
        const onHookError = vi.fn();
        const onTokenRefresh = vi.fn(() => {
            throw new Error("persistence failed");
        });
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
            onTokenRefresh,
            onHookError,
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await expect(api.query.media({ id: 1, type: "ANIME" })).resolves.toEqual({ id: 1 });

        expect(mocks.request).toHaveBeenCalledTimes(3);
        expect(onTokenRefresh).toHaveBeenCalledTimes(1);
        expect(onHookError).toHaveBeenCalledTimes(1);
        // The observer receives the structured diagnostic: the raw thrown
        // value rides behind it as the cause.
        const [name, error] = onHookError.mock.calls[0];
        expect(name).toBe("onTokenRefresh");
        expect((error as Error).message).toBe(
            "The onTokenRefresh hook threw and was ignored: persistence failed"
        );
        expect((error as Error).cause).toBeInstanceOf(Error);
        expect(((error as Error).cause as Error).message).toBe("persistence failed");
    });

    test("swaps auth onto lazily-constructed operations: an operation first accessed after a refresh starts with the fresh token", async () => {
        // The wiring tracks constructed instances and rewrites the live auth
        // cell. An operation whose getter runs after the swap must construct
        // against the refreshed cell, not the stale construction-time value.
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
        });

        // First call: `media` 401s, refresh succeeds, replay succeeds.
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });
        await api.query.media({ id: 1, type: "ANIME" });

        // Second call: a DIFFERENT operation, constructed only now, must
        // already carry the fresh token — no second refresh.
        mocks.request.mockResolvedValueOnce({ data: { data: { User: { id: 7 } } } });
        await api.query.viewer();

        expect(tokenEndpointCalls()).toHaveLength(1);
        expect(configAt(2).headers.Authorization).toBe("Bearer fresh-access-token");
    });

    test("bootstraps from a missing auth token: AniLinkAuthError triggers one refresh, then the request runs with the new token", async () => {
        const onTokenRefresh = vi.fn();
        const api = buildAniListApi(undefined, undefined, undefined, {
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
            onTokenRefresh,
        });

        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await expect(api.mutation.updateUser({ about: "bootstrapped" })).resolves.toBeDefined();

        expect(mocks.request).toHaveBeenCalledTimes(2);
        expect(tokenEndpointCalls()).toHaveLength(1);
        expect(configAt(1).headers.Authorization).toBe("Bearer fresh-access-token");
        expect(onTokenRefresh).toHaveBeenCalledTimes(1);
    });

    test("surfaces the sanitized refresh error when bootstrapping without an auth token and the grant fails", async () => {
        const api = buildAniListApi(undefined, undefined, undefined, {
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(400));

        await expect(api.mutation.updateUser({ about: "x" })).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof AniLinkApiError &&
                error.status === 400 &&
                error.message.includes("AniList token request")
        );

        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("does not bootstrap without an auth token when refresh credentials are absent", async () => {
        const api = buildAniListApi();

        await expect(api.mutation.updateUser({ about: "x" })).rejects.toBeInstanceOf(
            AniLinkAuthError
        );

        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("surfaces the replayed 401 when the replay also fails — no retry loop", async () => {
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));

        await expect(api.query.media({ id: 1, type: "ANIME" })).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 401
        );

        expect(mocks.request).toHaveBeenCalledTimes(3);
        expect(tokenEndpointCalls()).toHaveLength(1);
    });

    test("surfaces the sanitized refresh error and does not replay when the token endpoint fails", async () => {
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(400));

        await expect(api.query.media({ id: 1, type: "ANIME" })).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof AniLinkApiError &&
                error.status === 400 &&
                error.message.includes("AniList token request")
        );

        expect(mocks.request).toHaveBeenCalledTimes(2);
    });

    test("reports a failed refresh grant under the token-refresh kind with the sanitized error as the cause", async () => {
        // A failed refresh grant is not a hook failure: `kind` is the sole
        // machine key consumers switch on, so counting grant failures as
        // `hook-failure` corrupts hook-health metrics. The diagnostic
        // carries its own `token-refresh` kind, and the observer receives
        // the sanitized refresh error itself as the cause — the same
        // AniLinkError (with status/code) the caller is about to catch,
        // not a plain wrapper that hides them.
        const onHookError = vi.fn();
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
            onHookError,
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(400));

        const surfaced = await api.query
            .media({ id: 1, type: "ANIME" })
            .catch((error: unknown) => error);

        expect(onHookError).toHaveBeenCalledTimes(1);
        const [name, error] = onHookError.mock.calls[0];
        expect(name).toBe("aniListTokenRefresh");
        expect((error as Error).message).toBe(
            "The AniList token refresh failed: AniList token request failed with status 400."
        );
        // The cause is the sanitized refresh error the caller catches —
        // an AniLinkApiError carrying the upstream status and code.
        const cause = (error as Error).cause;
        expect(cause).toBe(surfaced);
        expect(cause).toBeInstanceOf(AniLinkApiError);
        expect((cause as AniLinkApiError).status).toBe(400);
    });

    test("does not console.warn a failed refresh grant that is rethrown to the caller", async () => {
        // The refresh failure is rethrown to the caller, who handles it
        // from the rejection. A console.warn fallback on top of the
        // rethrow would report the same failure twice — once as noise,
        // once as the error the caller already catches.
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(400));

        await expect(api.query.media({ id: 1, type: "ANIME" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );

        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    test("routes a failed refresh grant to the observer even in diagnostics mode silent", async () => {
        // The refresh-grant diagnostic is a real failure the consumer
        // asked to observe (mirroring the rawError rule for hook
        // failures): `silent` suppresses only unsolicited fallback
        // output, never a configured observer.
        const onHookError = vi.fn();
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
            onHookError,
            diagnostics: "silent",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(400));

        await expect(api.query.media({ id: 1, type: "ANIME" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );

        expect(onHookError).toHaveBeenCalledTimes(1);
        const [name] = onHookError.mock.calls[0];
        expect(name).toBe("aniListTokenRefresh");
    });

    test("rejects an invalid diagnostics value with a TypeError at construction", () => {
        // The refresher reads `diagnostics` straight from the credential
        // slot, which never passes through resolveRequestOptions — so it
        // must validate through the same shared resolver or a typo like
        // "verbose" would behave as an accidental quasi-"hook" mode.
        expect(() =>
            buildAniListApi("expired-access-token", undefined, undefined, {
                authToken: "expired-access-token",
                refreshToken: "stored-refresh-token",
                clientId: "anilist-client-id",
                clientSecret: "anilist-client-secret",
                diagnostics: "verbose" as never,
            })
        ).toThrow(TypeError);
    });

    test("passes non-401 failures through without refreshing", async () => {
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
            clientSecret: "anilist-client-secret",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(404));

        await expect(api.query.media({ id: 1, type: "ANIME" })).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 404
        );

        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(tokenEndpointCalls()).toHaveLength(0);
    });

    test("does not refresh on 401 when no refresh token is configured", async () => {
        const api = buildAniListApi("anilist-token");

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));

        await expect(api.query.media({ id: 1, type: "ANIME" })).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 401
        );

        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(tokenEndpointCalls()).toHaveLength(0);
    });

    test("does not refresh on 401 when the client secret is missing — AniList's grant requires it", async () => {
        // Unlike MAL, AniList's refresh grant requires the client secret.
        // Without the full set every 401 would trigger a doomed refresh
        // grant instead of surfacing the 401, so the lifecycle stays off.
        const api = buildAniListApi("anilist-token", undefined, undefined, {
            authToken: "anilist-token",
            refreshToken: "stored-refresh-token",
            clientId: "anilist-client-id",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));

        await expect(api.query.media({ id: 1, type: "ANIME" })).rejects.toBeInstanceOf(
            AniLinkApiError
        );
        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(tokenEndpointCalls()).toHaveLength(0);
    });

    test("does not activate the refresh lifecycle when the refresh credentials are whitespace-only", async () => {
        // A whitespace-only value must be treated as missing, exactly like
        // the empty string: otherwise every 401 performs a doomed refresh
        // grant before replaying.
        const api = buildAniListApi("anilist-token", undefined, undefined, {
            authToken: "anilist-token",
            refreshToken: "   ",
            clientId: "   ",
            clientSecret: "   ",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));

        await expect(api.query.media({ id: 1, type: "ANIME" })).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 401
        );

        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(tokenEndpointCalls()).toHaveLength(0);
    });

    test("trims credential values before sending them on the refresh grant", async () => {
        // A credential copied out of an env file with trailing whitespace
        // must still authenticate: the wiring trims before constructing the
        // refresher.
        const api = buildAniListApi("expired-access-token", undefined, undefined, {
            authToken: "expired-access-token",
            refreshToken: "  stored-refresh-token  ",
            clientId: "  anilist-client-id  ",
            clientSecret: "  anilist-client-secret  ",
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await api.query.media({ id: 1, type: "ANIME" });

        const refreshConfig = tokenEndpointCalls()[0];
        expect(formField(refreshConfig, "client_id")).toBe("anilist-client-id");
        expect(formField(refreshConfig, "client_secret")).toBe("anilist-client-secret");
        expect(formField(refreshConfig, "refresh_token")).toBe("stored-refresh-token");
    });

    test("pins the AniLinkGraphQLError extends AniLinkApiError inheritance the refresh classifier relies on", () => {
        // The 401 classifier in AniListTokenRefresher matches on
        // AniLinkApiError; GraphQL-envelope 401s are normalized to
        // AniLinkGraphQLError with the upstream status. If this inheritance
        // is ever restructured, this test fails before the refresh
        // lifecycle silently stops triggering.
        const graphqlError = new AniLinkGraphQLError([
            { message: "Not Authenticated", status: 401 },
        ]);
        expect(graphqlError).toBeInstanceOf(AniLinkApiError);
        expect(graphqlError.status).toBe(401);
    });

    test("buildRefreshedAuth preserves headers from the operation's live auth", () => {
        // The replayed request authenticates with the fresh bearer token;
        // headers the caller attached to structured auth (a proxy header, a
        // tracing header) must survive the swap instead of silently
        // disappearing after the first refresh (mirroring MAL).
        expect(
            buildRefreshedAuth(
                { token: "old", headers: { "X-Proxy": "kept", "X-Trace": "kept-too" } },
                "new"
            )
        ).toEqual({ token: "new", headers: { "X-Proxy": "kept", "X-Trace": "kept-too" } });
        // A plain-string auth (the common case) replays with no headers.
        expect(buildRefreshedAuth("plain-token", "new")).toEqual({
            token: "new",
            headers: undefined,
        });
        expect(buildRefreshedAuth(undefined, "new")).toEqual({ token: "new", headers: undefined });
        // A structured auth with an empty headers object collapses to none.
        expect(buildRefreshedAuth({ token: "old", headers: {} }, "new")).toEqual({
            token: "new",
            headers: undefined,
        });
    });

    test("resolveAniListCredentials strips the refresh fields from the shared transport options", () => {
        expect(
            resolveAniListCredentials({
                authToken: "anilist-token",
                refreshToken: "stored-refresh-token",
                clientId: "anilist-client-id",
                clientSecret: "anilist-client-secret",
                onTokenRefresh: vi.fn(),
                timeout: 5_000,
            })
        ).toEqual({
            auth: "anilist-token",
            options: { timeout: 5_000 },
        });
    });

    test("refreshes through the composed AniLink client constructed with anilist credentials", async () => {
        const onTokenRefresh = vi.fn();
        const aniLink = new AniLink({
            anilist: {
                authToken: "expired-access-token",
                refreshToken: "stored-refresh-token",
                clientId: "anilist-client-id",
                clientSecret: "anilist-client-secret",
                onTokenRefresh,
            },
        });

        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));
        mocks.request.mockResolvedValueOnce({ data: tokenResponse() });

        await expect(aniLink.anilist.query.media({ id: 1, type: "ANIME" })).resolves.toEqual({
            id: 1,
        });

        expect(mocks.request).toHaveBeenCalledTimes(3);
        expect(configAt(2).headers.Authorization).toBe("Bearer fresh-access-token");
        expect(onTokenRefresh).toHaveBeenCalledWith(tokenResponse());
    });
});
