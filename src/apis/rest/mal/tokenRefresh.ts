/**
 * The MAL binding of the shared token-refresh lifecycle.
 *
 * The lifecycle itself — the 401/missing-token classifier, the deduplicated
 * in-flight grant, the auth swap, the callbacks, and the single replay —
 * lives in the shared coordinator (`base/tokenRefresh.ts`). This module is
 * the MAL adapter: the refresh grant behind the {@link TokenExchange} seam
 * and the auth rebuild that drops MAL's client-ID header.
 *
 * `MalCredentials.refreshToken` and `clientId` opt a client into the
 * automatic refresh path. Unlike AniList, MAL's refresh grant does not
 * require the client secret, so the lifecycle activates without it.
 */
import { type AniLinkError } from "../../../base/AniLinkError";
import type { OnHookErrorHandler, RequestAuthInput } from "../../../base/RequestHandler";
import { type DiagnosticsMode } from "../../../base/transportTypes";
import { TokenRefresher, type TokenExchange } from "../../../base/tokenRefresh";
import { refreshMalAccessToken, type MalTokenResponse } from "./auth";

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
 * The fields the MAL wiring passes to {@link buildMalTokenRefresher}.
 *
 * @see {@link buildMalTokenRefresher}
 */
export interface MalTokenRefresherOptions {
    /** The MAL application client ID, required for the refresh grant. */
    clientId: string;
    /** The stored MAL refresh token exchanged for new access tokens. */
    refreshToken: string;
    /** The MAL application secret, when the application requires one. */
    clientSecret?: string;
    /** Optional callback invoked once after every successful refresh. */
    onTokenRefresh?: MalTokenRefreshCallback;
    /** Optional callback invoked once when a refresh grant fails. */
    onTokenRefreshError?: MalTokenRefreshErrorCallback;
    /** Optional observer for `onTokenRefresh` failures, mirroring the transport hooks. */
    onHookError?: OnHookErrorHandler;
    /** How a throwing `onTokenRefresh` callback with no observer is reported; defaults to `"warn"`. */
    diagnostics?: DiagnosticsMode;
    /**
     * Swaps the fresh access token onto the operation instances. Called
     * between the refresh and the replay so the replayed request carries the
     * new auth material. The callback must rebuild from each operation's
     * live auth (not a construction-time snapshot) so auth changed through
     * any other path survives the replay.
     */
    applyAccessToken: (accessToken: string) => void;
}

/**
 * Builds the MAL refresh coordinator: the shared lifecycle bound to MAL's
 * refresh grant.
 *
 * The exchange adapter runs MAL's refresh-token grant with the client ID
 * (and the client secret when the application requires one); its sanitized
 * error (an `AniLinkApiError` or `AniLinkNetworkError`) is the error the
 * awaiting caller catches. Grant failures are reported under the
 * `malTokenRefresh` hook name.
 *
 * @param options - The refresh grant fields, the auth-swap callback, the optional persistence and failure callbacks, and the diagnostics mode.
 * @returns The configured shared coordinator.
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const buildMalTokenRefresher = (
    options: MalTokenRefresherOptions
): TokenRefresher<MalTokenResponse> => {
    const exchange: TokenExchange<MalTokenResponse> = (refreshToken) =>
        refreshMalAccessToken({
            clientId: options.clientId,
            refreshToken,
            clientSecret: options.clientSecret,
        });
    return new TokenRefresher<MalTokenResponse>({
        exchange,
        refreshToken: options.refreshToken,
        provider: { hookName: "malTokenRefresh", providerLabel: "MAL" },
        onTokenRefresh: options.onTokenRefresh,
        onTokenRefreshError: options.onTokenRefreshError,
        onHookError: options.onHookError,
        diagnostics: options.diagnostics,
        applyAccessToken: options.applyAccessToken,
    });
};

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
): RequestAuthInput => {
    const headers =
        typeof auth === "object" && auth?.headers !== undefined
            ? Object.fromEntries(
                  Object.entries(auth.headers).filter(([key]) => key !== "X-MAL-CLIENT-ID")
              )
            : undefined;
    return {
        token: accessToken,
        headers: headers !== undefined && Object.keys(headers).length > 0 ? headers : undefined,
    };
};
