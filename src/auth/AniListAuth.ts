import axios from "axios";

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
 * application, AniList redirects to `redirectUri` with a `?code=` query
 * parameter that you pass to {@link getAccessToken}.
 *
 * @param clientId - The client ID of your AniList API application.
 * @param redirectUri - The redirect URI registered for your AniList application.
 * @returns The fully encoded authorization URL.
 * @example
 * ```typescript
 * const url = buildAuthorizationUrl("1234", "https://example.com/callback");
 * // Open `url` in a browser and read `code` from the redirect.
 * ```
 */
export const buildAuthorizationUrl = (clientId: string, redirectUri: string): string =>
    `${ANILIST_AUTHORIZE_URL}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&response_type=code`;

const requestToken = async (params: Record<string, string>): Promise<AniListTokenResponse> => {
    const response = await axios.post<AniListTokenResponse>(
        ANILIST_TOKEN_URL,
        new URLSearchParams(params).toString(),
        {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
    );

    return response.data;
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
 * @throws An error if the token request fails, for example when the code is invalid or expired.
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
 * @throws An error if the token request fails, for example when the refresh token is invalid or revoked.
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
