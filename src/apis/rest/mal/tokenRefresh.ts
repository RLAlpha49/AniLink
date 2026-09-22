/**
 * The MAL binding of the shared token-refresh lifecycle.
 *
 * The lifecycle itself — the grant POST, the expiry math, the auth
 * rebuild, the 401/missing-token classifier, the deduplicated in-flight
 * grant, the callbacks, and the single replay — lives in the shared
 * module (`base/tokenRefresh.ts`). This module is the thin MAL adapter:
 * the wiring-facing option and callback types plus two builders bound to
 * the {@link MAL_TOKEN_GRANT} descriptor (the MAL token endpoint, sanitize
 * label, `X-MAL-CLIENT-ID` strip rule, and diagnostics identity, declared
 * in `./auth`).
 *
 * `MalCredentials.refreshToken` and `clientId` opt a client into the
 * automatic refresh path. Unlike AniList, MAL's refresh grant does not
 * require the client secret, so the lifecycle activates without it.
 */
import { type AniLinkError } from "../../../base/AniLinkError";
import type { RequestAuthInput } from "../../../base/RequestHandler";
import { rewriteAuth, type TokenRefreshOptions, TokenRefresher } from "../../../base/tokenRefresh";
import { MAL_TOKEN_GRANT, type MalTokenResponse } from "./auth";

/**
 * Callback invoked after every successful automatic MAL token refresh so
 * callers can persist the new access/refresh token pair.
 *
 * The callback fires exactly once per refresh grant — concurrent 401s share
 * one grant and one callback invocation. The response follows MAL's
 * rotation semantics: when the token endpoint omits `refresh_token`, the
 * coordinator keeps the stored one, and the response passed to the callback
 * carries the effective refresh token. Exceptions thrown by the callback
 * are reported through `onHookError` (falling back to a console warning)
 * and never abort the replayed request.
 *
 * @see {@link MalTokenResponse}
 */
export type MalTokenRefreshCallback = (response: MalTokenResponse) => void;

/**
 * Callback invoked when an automatic MAL token-refresh grant fails.
 *
 * The callback fires exactly once per failed grant — concurrent 401s share
 * one in-flight grant and one failure event. It receives the sanitized
 * refresh error (an {@link AniLinkError} carrying the upstream `status` and
 * `code`), the same error the awaiting caller catches. Exceptions thrown by
 * the callback are reported through `onHookError` (falling back to a console
 * warning) and never replace the propagated refresh error.
 *
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export type MalTokenRefreshErrorCallback = (error: AniLinkError) => void;

/**
 * The fields the MAL wiring passes to {@link buildMalTokenRefresher}: the
 * shared refresh-option shape with MAL's one allowance — the client secret
 * is optional, unlike AniList's required one.
 *
 * @see {@link buildMalTokenRefresher}
 */
export type MalTokenRefresherOptions = TokenRefreshOptions<MalTokenResponse>;

/**
 * Builds the MAL refresh coordinator: the shared lifecycle bound to the
 * {@link MAL_TOKEN_GRANT} descriptor.
 *
 * The coordinator runs MAL's refresh-token grant with the client ID (and
 * the client secret when the application requires one) through the shared
 * token transport; its sanitized error (an `AniLinkApiError` or
 * `AniLinkNetworkError`) is the error the awaiting caller catches. Grant
 * failures are reported under the `malTokenRefresh` hook name.
 *
 * @param options - The refresh grant fields, the auth-swap callback, the optional persistence and failure callbacks, and the diagnostics mode.
 * @returns The configured shared coordinator.
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const buildMalTokenRefresher = (
    options: MalTokenRefresherOptions
): TokenRefresher<MalTokenResponse> =>
    new TokenRefresher<MalTokenResponse>({
        descriptor: MAL_TOKEN_GRANT,
        ...options,
    });

/**
 * Builds the auth material the operations replay with after a refresh.
 *
 * The token swap replaces the bearer token, preserves the other headers,
 * and drops the `X-MAL-CLIENT-ID` header: the replayed request
 * authenticates with the bearer token, and the client-ID header is only
 * for client-ID-only access to public endpoints — keeping a stale one
 * would widen client-ID exposure to intermediaries that log request
 * headers, contradicting `resolveMalCredentials`.
 *
 * @param auth - The auth material the operations were constructed with.
 * @param accessToken - The fresh access token from the refresh grant.
 * @returns The replacement {@link RequestAuthInput}.
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const buildRefreshedAuth = (
    auth: RequestAuthInput | undefined,
    accessToken: string
): RequestAuthInput => rewriteAuth(MAL_TOKEN_GRANT, auth, accessToken);
