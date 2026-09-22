import { type RequestOptions } from "../../../base/RequestHandler";
import {
    computeTokenExpiry,
    refreshGrantParams,
    requestTokenGrant,
    type TokenGrantDescriptor,
} from "../../../base/tokenRefresh";
import { MAL_AUTHORIZE_URL, MAL_TOKEN_URL } from "./constants";

/**
 * The MAL facts the shared token machinery reads: the token endpoint, the
 * sanitize label, the strip rule (the replayed request authenticates with
 * the bearer token, so the client-ID header is dropped — it is only for
 * client-ID-only access to public endpoints, and keeping a stale one would
 * widen client-ID exposure to intermediaries that log request headers,
 * contradicting `resolveMalCredentials`), and the diagnostics identity.
 *
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const MAL_TOKEN_GRANT: TokenGrantDescriptor = {
    tokenUrl: MAL_TOKEN_URL,
    errorLabel: "MAL token request",
    stripHeaders: ["X-MAL-CLIENT-ID"],
    provider: { hookName: "malTokenRefresh", providerLabel: "MAL" },
};

/**
 * {@link MalTokenResponse} is the successful MyAnimeList OAuth2 token response returned by {@link getMalAccessToken} and {@link refreshMalAccessToken}.
 *
 * It carries the bearer token consumed by the MAL operation classes (`MalAnimeOperation`, `MalMangaOperation`, and `MalUserOperation`) through `MalCredentials`.
 *
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export interface MalTokenResponse {
    /** The bearer access token used by MAL REST operations. */
    access_token: string;
    /** The token type, normally `Bearer`. */
    token_type: string;
    /** The access-token lifetime in seconds. */
    expires_in: number;
    /** A refresh token, when MAL issues one. */
    refresh_token?: string;
    /** The granted scopes, when MAL returns them. */
    scope?: string;
}

/**
 * {@link MalAuthorizationCodeRequest} is the input for {@link getMalAccessToken} when exchanging a MAL authorization code with PKCE.
 *
 * It carries the client identity and PKCE verifier initiated by {@link buildMalAuthorizationUrl}, plus optional {@link RequestOptions} for the token call.
 *
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export interface MalAuthorizationCodeRequest {
    /** The MAL application client ID. */
    clientId: string;
    /** The authorization code returned by the redirect. */
    code: string;
    /** The original PKCE code verifier. */
    codeVerifier: string;
    /** An optional client secret for applications that use one. */
    clientSecret?: string;
    /** Shared transport settings for the token request. */
    options?: RequestOptions;
}

/**
 * {@link MalRefreshTokenRequest} is the input for {@link refreshMalAccessToken} when refreshing a MAL access token.
 *
 * It carries the client identity and stored refresh token from a prior {@link MalTokenResponse}, plus optional {@link RequestOptions} for the token call.
 *
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export interface MalRefreshTokenRequest {
    /** The MAL application client ID. */
    clientId: string;
    /** The stored MAL refresh token. */
    refreshToken: string;
    /** An optional client secret for applications that use one. */
    clientSecret?: string;
    /** Shared transport settings for the token request. */
    options?: RequestOptions;
}

/**
 * {@link buildMalAuthorizationUrl} is the PKCE helper that builds the MyAnimeList OAuth2 authorization URL for {@link getMalAccessToken}.
 *
 * It encodes the client identity and PKCE challenge from {@link MalAuthorizationCodeRequest} and returns the URL to open in a browser. MAL's authorization server currently supports only the `plain` PKCE method. Validate the `state` on redirect before exchanging the code via {@link getMalAccessToken}.
 *
 * @param clientId - The MAL application client ID from {@link MalAuthorizationCodeRequest.clientId}.
 * @param codeChallenge - The PKCE challenge for the login attempt; under MAL's `plain` method this is the verifier itself.
 * @param state - Optional opaque CSRF state to validate on the redirect.
 * @returns The fully encoded authorization URL for the MAL OAuth flow.
 * @example
 * ```typescript
 * const url = buildMalAuthorizationUrl("client-id", "pkce-challenge", "csrf-state");
 * // Open url in a browser, then exchange the returned code with getMalAccessToken.
 * ```
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const buildMalAuthorizationUrl = (
    clientId: string,
    codeChallenge: string,
    state?: string
): string => {
    const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        code_challenge: codeChallenge,
        code_challenge_method: "plain",
    });
    if (state !== undefined) params.set("state", state);
    return `${MAL_AUTHORIZE_URL}?${params.toString().replaceAll("+", "%20")}`;
};

/**
 * {@link getMalAccessToken} exchanges a MAL authorization code for an access token through PKCE.
 *
 * It completes the flow started by {@link buildMalAuthorizationUrl} using the {@link MalAuthorizationCodeRequest} fields and returns a {@link MalTokenResponse} consumed by `MalCredentials` and `buildMyAnimeListApi`. Transport is shared with {@link RequestOptions}.
 *
 * @param request - The authorization-code fields and optional transport settings; a {@link MalAuthorizationCodeRequest}.
 * @returns The {@link MalTokenResponse} for the authenticated session.
 * @throws `AniLinkApiError` when MAL rejects the grant, or `AniLinkNetworkError` on timeout, cancellation, or network failure; both carry sanitized token-request details.
 * @example
 * ```typescript
 * const token = await getMalAccessToken({ clientId, code, codeVerifier });
 * // token.access_token -> pass as MalCredentials.accessToken to buildMyAnimeListApi
 * ```
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const getMalAccessToken = (
    request: MalAuthorizationCodeRequest
): Promise<MalTokenResponse> =>
    requestTokenGrant<MalTokenResponse>(
        MAL_TOKEN_GRANT,
        {
            client_id: request.clientId,
            code: request.code,
            code_verifier: request.codeVerifier,
            grant_type: "authorization_code",
            ...(request.clientSecret === undefined ? {} : { client_secret: request.clientSecret }),
        },
        undefined,
        request.options
    );

/**
 * {@link refreshMalAccessToken} exchanges a MAL refresh token for a new access token.
 *
 * It uses the {@link MalRefreshTokenRequest} fields from a prior {@link MalTokenResponse} and returns a fresh {@link MalTokenResponse} for `MalCredentials` and `buildMyAnimeListApi`. Transport is shared with {@link RequestOptions}.
 *
 * @param request - The refresh-token fields and optional transport settings; a {@link MalRefreshTokenRequest}.
 * @returns The refreshed {@link MalTokenResponse}.
 * @throws `AniLinkApiError` when MAL rejects the grant, or `AniLinkNetworkError` on timeout, cancellation, or network failure; both carry sanitized token-request details.
 * @example
 * ```typescript
 * const token = await refreshMalAccessToken({ clientId, refreshToken });
 * // token.access_token -> replace the stored MalCredentials.accessToken
 * ```
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const refreshMalAccessToken = (request: MalRefreshTokenRequest): Promise<MalTokenResponse> =>
    requestTokenGrant<MalTokenResponse>(
        MAL_TOKEN_GRANT,
        refreshGrantParams(request.clientId, request.clientSecret, request.refreshToken),
        undefined,
        request.options
    );

/**
 * {@link getMalTokenExpiry} computes the absolute expiry time of a {@link MalTokenResponse}.
 *
 * It adds `expires_in` from the response returned by {@link getMalAccessToken} or {@link refreshMalAccessToken} to the supplied clock value, so callers can schedule refresh before the token held in `MalCredentials` expires.
 *
 * @param response - The {@link MalTokenResponse} whose `expires_in` to evaluate.
 * @param now - The current time in milliseconds since the Unix epoch.
 * @returns The moment the access token expires.
 * @throws A `TypeError` when `expires_in` is not a positive finite number — `0`, negative, `NaN`, or `Infinity` values produce an already-expired or nonsensical expiry that silently breaks proactive-refresh scheduling (and is one comparison-operator slip away from a refresh loop), so they are rejected instead.
 * @example
 * ```typescript
 * const expiresAt = getMalTokenExpiry(token);
 * if (expiresAt.getTime() - Date.now() < 60_000) await refreshMalAccessToken({ clientId, refreshToken });
 * ```
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const getMalTokenExpiry = (response: MalTokenResponse, now?: number): Date =>
    computeTokenExpiry(response, now);
