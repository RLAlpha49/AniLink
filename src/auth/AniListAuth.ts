import axios from "axios";
import {
    AniLinkApiError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
} from "../base/AniLinkError";

/**
 * The explicit timeout applied to OAuth token requests. Token calls bypass the
 * shared request pipeline, so they carry their own shorter transport timeout.
 */
const AUTH_TOKEN_TIMEOUT_MS = 10_000;

/** The AniList OAuth2 token endpoint used for code exchange and refresh. */
export const ANILIST_TOKEN_URL = "https://anilist.co/api/v2/oauth/token";

/** The AniList OAuth2 authorization endpoint where users grant access. */
export const ANILIST_AUTHORIZE_URL = "https://anilist.co/api/v2/oauth/authorize";

/**
 * A successful AniList OAuth2 token response.
 * `refresh_token` may be absent on refresh responses when AniList does not
 * rotate the refresh token.
 */
export interface AniListTokenResponse {
    /** The bearer token to pass to the `AniLink` constructor. */
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
 * Normalizes a failed OAuth token request into an `AniLinkError` subclass.
 *
 * Token request bodies carry `client_secret`, authorization `code`, and
 * `refresh_token` values, so the original Axios error is deliberately
 * discarded: the returned error carries only a safe message, a stable code,
 * and — for HTTP failures — the upstream response body, which contains no
 * credentials.
 *
 * @param error - The value thrown by the token request transport.
 * @returns A sanitized error that is safe to surface in application logs.
 */
const normalizeTokenRequestError = (error: unknown): AniLinkError => {
    if (axios.isCancel(error)) {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.ABORTED,
            "AniList token request was cancelled."
        );
    }

    if (axios.isAxiosError(error)) {
        if (error.response?.status !== undefined) {
            const status = error.response.status;
            const apiError = new AniLinkApiError(status, error.response.data);
            apiError.message = `AniList token request failed with status ${status}.`;
            return apiError;
        }

        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
            return new AniLinkNetworkError(
                AniLinkErrorCodes.TIMEOUT,
                "AniList token request timed out."
            );
        }

        return new AniLinkNetworkError(
            AniLinkErrorCodes.NETWORK,
            "AniList token request failed due to a network error."
        );
    }

    return new AniLinkError("AniList token request failed.", AniLinkErrorCodes.UNKNOWN);
};

const requestToken = async (params: Record<string, string>): Promise<AniListTokenResponse> => {
    try {
        const response = await axios.post<AniListTokenResponse>(
            ANILIST_TOKEN_URL,
            new URLSearchParams(params).toString(),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                timeout: AUTH_TOKEN_TIMEOUT_MS,
            }
        );

        return response.data;
    } catch (error) {
        throw normalizeTokenRequestError(error);
    }
};

/**
 * Exchanges an authorization code for an access token using the
 * authorization-code grant.
 *
 * @param clientId - The client ID of your AniList API application.
 * @param clientSecret - The client secret of your AniList API application.
 * @param code - The authorization code from the redirect URI `code` query parameter.
 * @param redirectUri - The redirect URI registered for your AniList application. This parameter is optional but must match the URI used in {@link buildAuthorizationUrl} when AniList requires it.
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
    redirectUri?: string
): Promise<AniListTokenResponse> =>
    requestToken({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri ?? "",
        code,
    });

/**
 * Exchanges a refresh token for a new access token using the refresh-token
 * grant.
 *
 * @param clientId - The client ID of your AniList API application.
 * @param clientSecret - The client secret of your AniList API application.
 * @param refreshToken - The refresh token from a previous token response.
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
    refreshToken: string
): Promise<AniListTokenResponse> =>
    requestToken({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
    });

/**
 * Computes the absolute expiry time of a token response.
 *
 * Combine this with {@link refreshAccessToken} to refresh proactively before
 * the access token expires instead of waiting for a `401` from the API.
 *
 * @param response - The token response to compute the expiry for.
 * @param now - The current time in milliseconds since the Unix epoch. Defaults to the time at which the helper is called.
 * @returns The moment the access token expires.
 * @example
 * ```typescript
 * const token = await getAccessToken("1234", "secret", "code-from-redirect");
 * if (Date.now() >= getTokenExpiry(token).getTime() - 60_000) {
 *     const refreshed = await refreshAccessToken("1234", "secret", storedRefreshToken);
 * }
 * ```
 */
export const getTokenExpiry = (response: AniListTokenResponse, now: number = Date.now()): Date =>
    new Date(now + response.expires_in * 1000);
