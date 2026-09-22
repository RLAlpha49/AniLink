/**
 * The AniList binding of the shared token-refresh lifecycle.
 *
 * The lifecycle itself — the grant POST, the expiry math, the auth
 * rebuild, the 401/missing-token classifier, the deduplicated in-flight
 * grant, the callbacks, and the single replay — lives in the shared
 * module (`base/tokenRefresh.ts`). This module is the thin AniList
 * adapter: the wiring-facing option and callback types plus two builders
 * bound to the {@link ANILIST_TOKEN_GRANT} descriptor (the AniList token
 * endpoint, sanitize label, empty strip rule, and diagnostics identity,
 * declared in `./auth`).
 *
 * `AniListCredentials.refreshToken`, `clientId`, and `clientSecret` opt a
 * client into the automatic refresh path. Unlike MAL, AniList's refresh
 * grant requires the client secret, so the lifecycle only activates when
 * the secret is configured too.
 */
import { type AniLinkError } from "../../../base/AniLinkError";
import type { RequestAuthInput } from "../../../base/RequestHandler";
import { rewriteAuth, type TokenRefreshOptions, TokenRefresher } from "../../../base/tokenRefresh";
import { ANILIST_TOKEN_GRANT, type AniListTokenResponse } from "./auth";

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
 * The fields the AniList wiring passes to {@link buildAniListTokenRefresher}:
 * the shared refresh-option shape with AniList's one narrowing — the
 * refresh grant requires the client secret, unlike MAL's optional one.
 *
 * @see {@link buildAniListTokenRefresher}
 */
export interface AniListTokenRefresherOptions extends TokenRefreshOptions<AniListTokenResponse> {
    /** The AniList application client secret, required by AniList's refresh grant. */
    clientSecret: string;
}

/**
 * Builds the AniList refresh coordinator: the shared lifecycle bound to
 * the {@link ANILIST_TOKEN_GRANT} descriptor.
 *
 * The coordinator runs AniList's refresh-token grant with the client ID
 * and secret through the shared token transport; its sanitized error (an
 * `AniLinkApiError` or `AniLinkNetworkError`) is the error the awaiting
 * caller catches. Grant failures are reported under the
 * `aniListTokenRefresh` hook name.
 *
 * @param options - The refresh grant fields, the auth-swap callback, the optional persistence and failure callbacks, and the diagnostics mode.
 * @returns The configured shared coordinator.
 * @see https://docs.anilist.co/reference/api
 */
export const buildAniListTokenRefresher = (
    options: AniListTokenRefresherOptions
): TokenRefresher<AniListTokenResponse> =>
    new TokenRefresher<AniListTokenResponse>({
        descriptor: ANILIST_TOKEN_GRANT,
        ...options,
    });

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
): RequestAuthInput => rewriteAuth(ANILIST_TOKEN_GRANT, auth, accessToken);
