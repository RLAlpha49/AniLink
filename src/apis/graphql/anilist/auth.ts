import { type RequestOptions } from "../../../base/RequestHandler";
import {
    computeTokenExpiry,
    refreshGrantParams,
    requestTokenGrant,
    type TokenGrantDescriptor,
} from "../../../base/tokenRefresh";

/** The AniList OAuth2 token endpoint used for code exchange and refresh. */
export const ANILIST_TOKEN_URL = "https://anilist.co/api/v2/oauth/token";

/** The AniList OAuth2 authorization endpoint where users grant access. */
export const ANILIST_AUTHORIZE_URL = "https://anilist.co/api/v2/oauth/authorize";

/**
 * The AniList facts the shared token machinery reads: the token endpoint,
 * the sanitize label, the strip rule (AniList drops no request headers on
 * replay — the client ID and secret belong to the grant body, never to
 * GraphQL request headers), and the diagnostics identity.
 *
 * @see https://docs.anilist.co/reference/api
 */
export const ANILIST_TOKEN_GRANT: TokenGrantDescriptor = {
    tokenUrl: ANILIST_TOKEN_URL,
    errorLabel: "AniList token request",
    stripHeaders: [],
    provider: { hookName: "aniListTokenRefresh", providerLabel: "AniList" },
};

/**
 * A successful AniList OAuth2 token response.
 * `refresh_token` may be absent on refresh responses when AniList does not
 * rotate the refresh token.
 */
export interface AniListTokenResponse {
    /** The bearer token to pass to the {@link AniLink} constructor. */
    access_token: string;
    /** The token type, typically `Bearer`. */
    token_type: string;
    /** Token lifetime in seconds. */
    expires_in: number;
    /** The refresh token, when AniList issues or rotates one. */
    refresh_token?: string;
}

/**
 * Builds the AniList authorization URL for the authorization-code flow.
 *
 * Send the user to this URL in a browser. After they approve your
 * application, AniList redirects to `redirectUri` with `?code=` and `state=`
 * query parameters. Pass the `code` to {@link getAccessToken}.
 *
 * @param clientId - The client ID of your AniList API application.
 * @param redirectUri - The redirect URI registered for your AniList application.
 * @param state - Optional opaque value for additional CSRF protection. When provided it is appended to the URL; generate a random value per login attempt, bind it to the user session, and validate it on the redirect before exchanging the code.
 * @returns The fully encoded authorization URL.
 * @example
 * ```typescript
 * const state = crypto.randomUUID();
 * const url = buildAuthorizationUrl("1234", "https://example.com/callback", state);
 * // Open `url` in a browser, validate the redirect's `state` against the
 * // session, then read `code` from the redirect.
 * ```
 */
export const buildAuthorizationUrl = (
    clientId: string,
    redirectUri: string,
    state?: string
): string => {
    let url = `${ANILIST_AUTHORIZE_URL}?client_id=${encodeURIComponent(
        clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

    if (state !== undefined) {
        url += `&state=${encodeURIComponent(state)}`;
    }

    return url;
};

/**
 * Exchanges an authorization code for an access token using the
 * authorization-code grant.
 *
 * @param clientId - The client ID of your AniList API application.
 * @param clientSecret - The client secret of your AniList API application.
 * @param code - The authorization code from the redirect URI `code` query parameter.
 * @param redirectUri - The redirect URI registered for your AniList application. This parameter is optional but must match the URI used in {@link buildAuthorizationUrl} when AniList requires it. An empty string is treated as omitted.
 * @param signal - Optional `AbortSignal` to cancel the token exchange while it is in flight.
 * @param options - Optional transport settings for the token call; `timeout` defaults to the shared 10-second token-request timeout and `retry` defaults to disabled because the authorization code is single-use. Pass an explicit `retry` policy to opt back in.
 * @returns A promise that resolves to the token response containing `access_token`.
 * @throws An `AniLinkApiError` when AniList rejects the exchange, for example with `invalid_grant` for an invalid or expired code, or an `AniLinkNetworkError` on transport failure. Errors never include the request body, so the client secret and code are not leaked.
 * @example
 * ```typescript
 * const { access_token } = await getAccessToken(
 *     "1234",
 *     "secret",
 *     "code-from-redirect",
 *     "https://example.com/callback"
 * );
 * const aniLink = new AniLink(access_token);
 * ```
 */
export const getAccessToken = async (
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri?: string,
    signal?: AbortSignal,
    options?: RequestOptions
): Promise<AniListTokenResponse> =>
    requestTokenGrant<AniListTokenResponse>(
        ANILIST_TOKEN_GRANT,
        {
            grant_type: "authorization_code",
            client_id: clientId,
            client_secret: clientSecret,
            // Omit the key entirely when the caller provided no usable
            // value (undefined or blank): an empty-string value can be
            // rejected by AniList as a mismatch against the registered
            // redirect URI, while an omitted field is the documented
            // optional-parameter behavior.
            ...(redirectUri ? { redirect_uri: redirectUri } : {}),
            code,
        },
        signal,
        options
    );

/**
 * Exchanges a refresh token for a new access token using the refresh-token
 * grant.
 *
 * @param clientId - The client ID of your AniList API application.
 * @param clientSecret - The client secret of your AniList API application.
 * @param refreshToken - The refresh token from a previous token response.
 * @param signal - Optional `AbortSignal` to cancel the refresh while it is in flight.
 * @param options - Optional transport settings for the token call; `timeout` defaults to the shared 10-second token-request timeout and `retry` defaults to disabled because grant credentials are single-use. Pass an explicit `retry` policy to opt back in.
 * @returns A promise that resolves to the token response containing a new `access_token`. The `refresh_token` field may be absent when AniList does not rotate it.
 * @throws An `AniLinkApiError` when AniList rejects the refresh, for example when the refresh token is invalid or revoked, or an `AniLinkNetworkError` on transport failure. Errors never include the request body, so the client secret and refresh token are not leaked.
 * @example
 * ```typescript
 * const { access_token } = await refreshAccessToken("1234", "secret", "stored-refresh-token");
 * const aniLink = new AniLink(access_token);
 * ```
 */
export const refreshAccessToken = async (
    clientId: string,
    clientSecret: string,
    refreshToken: string,
    signal?: AbortSignal,
    options?: RequestOptions
): Promise<AniListTokenResponse> =>
    requestTokenGrant<AniListTokenResponse>(
        ANILIST_TOKEN_GRANT,
        refreshGrantParams(clientId, clientSecret, refreshToken),
        signal,
        options
    );

/**
 * Computes the absolute expiry time of a token response.
 *
 * Combine this with {@link refreshAccessToken} to refresh proactively before
 * the access token expires instead of waiting for a `401` from the API.
 *
 * @param response - The token response to compute the expiry for.
 * @param now - The current time in milliseconds since the Unix epoch. Defaults to the time at which the helper is called.
 * @returns The moment the access token expires.
 * @throws A `TypeError` when `expires_in` is not a positive finite number — `0`, negative, `NaN`, or `Infinity` values produce an already-expired or nonsensical expiry that silently breaks proactive-refresh scheduling (and is one comparison-operator slip away from a refresh loop), so they are rejected instead.
 * @example
 * ```typescript
 * const token = await getAccessToken("1234", "secret", "code-from-redirect");
 * if (Date.now() >= getTokenExpiry(token).getTime() - 60_000) {
 *     const refreshed = await refreshAccessToken("1234", "secret", storedRefreshToken);
 * }
 * ```
 */
export const getTokenExpiry = (response: AniListTokenResponse, now?: number): Date =>
    computeTokenExpiry(response, now);
