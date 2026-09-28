/**
 * The MAL binding of the shared token-refresh lifecycle.
 *
 * The shared module (`base/tokenRefresh.ts`) handles the grant POST, expiry
 * calculation, auth rebuild, 401/missing-token classification, in-flight
 * grant deduplication, callbacks, and one replay. This module adapts that
 * lifecycle for MAL. It defines the wiring-facing option and callback types
 * and two builders bound to {@link MAL_TOKEN_GRANT}. The descriptor declares
 * the MAL token endpoint, error label, `X-MAL-CLIENT-ID` strip rule, and
 * diagnostics identity in `./auth`.
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
 * The callback fires once per refresh grant. Concurrent 401s share one grant
 * and one callback invocation. The response follows MAL's
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
 * The callback fires once per failed grant. Concurrent 401s share one
 * in-flight grant and one failure event. It receives the sanitized
 * refresh error (an {@link AniLinkError} carrying the upstream `status` and
 * `code`), the same error the awaiting caller catches. Exceptions thrown by
 * the callback are reported through `onHookError` (falling back to a console
 * warning) and never replace the propagated refresh error.
 *
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export type MalTokenRefreshErrorCallback = (error: AniLinkError) => void;

/**
 * The options MAL wiring passes to {@link buildMalTokenRefresher}. They use
 * the shared refresh-option shape, but the client secret is optional for MAL.
 * AniList requires a client secret.
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
 * authenticates with the bearer token. The client-ID header is only for
 * client-ID-only access to public endpoints. Keeping it could expose the
 * client ID to intermediaries that log request headers and would conflict
 * with `resolveMalCredentials`.
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
