/**
 * The AniList binding of the shared token-refresh lifecycle.
 *
 * The lifecycle itself — the 401/missing-token classifier, the deduplicated
 * in-flight grant, the auth swap, the callbacks, and the single replay —
 * lives in the shared coordinator (`base/tokenRefresh.ts`). This module is
 * the AniList adapter: the refresh grant behind the {@link TokenExchange}
 * seam and the auth rebuild that preserves AniList's bearer-token shape.
 *
 * `AniListCredentials.refreshToken`, `clientId`, and `clientSecret` opt a
 * client into the automatic refresh path. Unlike MAL, AniList's refresh
 * grant requires the client secret, so the lifecycle only activates when
 * the secret is configured too.
 */
import { type AniLinkError } from "../../../base/AniLinkError";
import type { OnHookErrorHandler, RequestAuthInput } from "../../../base/RequestHandler";
import { type DiagnosticsMode } from "../../../base/transportTypes";
import { TokenRefresher, type TokenExchange } from "../../../base/tokenRefresh";
import { refreshAccessToken, type AniListTokenResponse } from "./auth";

/**
 * Callback invoked after every successful automatic AniList token refresh
 * so callers can persist the new access/refresh token pair.
 *
 * The callback fires exactly once per refresh grant — concurrent 401s share
 * one grant and one callback invocation. The response follows AniList's
 * rotation semantics: when the token endpoint omits `refresh_token`, the
 * coordinator keeps the stored one, and the response passed to the callback
 * carries the effective refresh token. Exceptions thrown by the callback
 * are reported through `onHookError` (falling back to a console warning)
 * and never abort the replayed request.
 *
 * @see {@link AniListTokenResponse}
 */
export type AniListTokenRefreshCallback = (response: AniListTokenResponse) => void;

/**
 * Callback invoked when an automatic AniList token-refresh grant fails.
 *
 * The callback fires exactly once per failed grant — concurrent 401s share
 * one in-flight grant and one failure event. It receives the sanitized
 * refresh error (an {@link AniLinkError} carrying the upstream `status` and
 * `code`), the same error the awaiting caller catches. Exceptions thrown by
 * the callback are reported through `onHookError` (falling back to a console
 * warning) and never replace the propagated refresh error.
 *
 * @see https://docs.anilist.co/reference/api
 */
export type AniListTokenRefreshErrorCallback = (error: AniLinkError) => void;

/**
 * The fields the AniList wiring passes to {@link buildAniListTokenRefresher}.
 *
 * @see {@link buildAniListTokenRefresher}
 */
export interface AniListTokenRefresherOptions {
    /** The AniList application client ID, required for the refresh grant. */
    clientId: string;
    /** The AniList application client secret, required by AniList's refresh grant. */
    clientSecret: string;
    /** The stored AniList refresh token exchanged for new access tokens. */
    refreshToken: string;
    /** Optional callback invoked once after every successful refresh. */
    onTokenRefresh?: AniListTokenRefreshCallback;
    /** Optional callback invoked once when a refresh grant fails. */
    onTokenRefreshError?: AniListTokenRefreshErrorCallback;
    /** Optional observer for `onTokenRefresh` failures, mirroring the transport hooks. */
    onHookError?: OnHookErrorHandler;
    /** How a throwing `onTokenRefresh` callback with no observer is reported; defaults to `"warn"`. */
    diagnostics?: DiagnosticsMode;
    /**
     * Swaps the fresh access token onto the operation instances. Called
     * between the refresh and the replay so the replayed request carries the
     * new auth material. The callback must write through the wiring's live
     * auth cell (not a construction-time snapshot) so both already-constructed
     * operations and instances built later see the refreshed token.
     */
    applyAccessToken: (accessToken: string) => void;
}

/**
 * Builds the AniList refresh coordinator: the shared lifecycle bound to
 * AniList's refresh grant.
 *
 * The exchange adapter runs AniList's refresh-token grant with the client
 * ID and secret; its sanitized error (an `AniLinkApiError` or
 * `AniLinkNetworkError`) is the error the awaiting caller catches. Grant
 * failures are reported under the `aniListTokenRefresh` hook name.
 *
 * @param options - The refresh grant fields, the auth-swap callback, the optional persistence and failure callbacks, and the diagnostics mode.
 * @returns The configured shared coordinator.
 * @see https://docs.anilist.co/reference/api
 */
export const buildAniListTokenRefresher = (
    options: AniListTokenRefresherOptions
): TokenRefresher<AniListTokenResponse> => {
    const exchange: TokenExchange<AniListTokenResponse> = (refreshToken) =>
        refreshAccessToken(options.clientId, options.clientSecret, refreshToken);
    return new TokenRefresher<AniListTokenResponse>({
        exchange,
        refreshToken: options.refreshToken,
        provider: { hookName: "aniListTokenRefresh", providerLabel: "AniList" },
        onTokenRefresh: options.onTokenRefresh,
        onTokenRefreshError: options.onTokenRefreshError,
        onHookError: options.onHookError,
        diagnostics: options.diagnostics,
        applyAccessToken: options.applyAccessToken,
    });
};

/**
 * Builds the auth material one operation replays with after a refresh.
 *
 * AniList authenticates with a bearer token, so the swap replaces the token
 * with the fresh one. Headers on the operation's structured pre-refresh auth
 * are preserved (mirroring MAL's `buildRefreshedAuth`, which keeps everything
 * except the provider's own client-ID header): a caller who attached extra
 * headers to the auth material — a proxy header, a tracing header — keeps
 * them after the first refresh instead of silently losing them mid-lifetime.
 * There is no AniList-specific header to strip: the client ID and secret
 * belong to the grant body, never to GraphQL request headers.
 *
 * @param auth - The operation's current auth material, read live at swap time so auth changed through any other path survives the replay.
 * @param accessToken - The fresh access token from the refresh grant.
 * @returns The replacement {@link RequestAuthInput}.
 * @see https://docs.anilist.co/reference/api
 */
export const buildRefreshedAuth = (
    auth: RequestAuthInput | undefined,
    accessToken: string
): RequestAuthInput => {
    const headers =
        typeof auth === "object" && auth?.headers !== undefined
            ? Object.fromEntries(Object.entries(auth.headers))
            : undefined;
    return {
        token: accessToken,
        headers: headers !== undefined && Object.keys(headers).length > 0 ? headers : undefined,
    };
};
