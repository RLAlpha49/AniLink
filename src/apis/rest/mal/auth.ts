import axios from "axios";
import {
    AniLinkApiError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
} from "../../../base/AniLinkError";
import { type RequestOptions, sendRequest } from "../../../base/RequestHandler";
import { MAL_AUTHORIZE_URL, MAL_TOKEN_URL } from "./constants";

/** The explicit timeout applied to MAL OAuth token requests by default. */
const MAL_AUTH_TIMEOUT_MS = 10_000;

/**
 * {@link MalTokenResponse} is the successful MyAnimeList OAuth2 token response returned by {@link getMalAccessToken} and {@link refreshMalAccessToken}.
 *
 * It carries the bearer token consumed by `MalAnimeOperation` and `MalUserOperation` through `MalCredentials`.
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
 * It encodes the client identity and PKCE challenge from {@link MalAuthorizationCodeRequest} and returns the URL to open in a browser. The current implementation sends `code_challenge_method=S256`; verify that method against the linked MAL authorization reference before relying on the helper. Validate the `state` on redirect before exchanging the code via {@link getMalAccessToken}.
 *
 * @param clientId - The MAL application client ID from {@link MalAuthorizationCodeRequest.clientId}.
 * @param codeChallenge - The PKCE challenge generated for the login attempt; this helper sends it with the `S256` method.
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
        code_challenge_method: "S256",
    });
    if (state !== undefined) params.set("state", state);
    return `${MAL_AUTHORIZE_URL}?${params.toString().replaceAll("+", "%20")}`;
};

/**
 * Normalizes a failed MAL OAuth token request into an {@link AniLinkError} subclass.
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
const normalizeMalTokenError = (error: unknown): AniLinkError => {
    if (error instanceof AniLinkApiError) {
        error.message = `MAL token request failed with status ${error.status}.`;
        return error;
    }
    if (error instanceof AniLinkError) return error;
    if (axios.isCancel(error)) {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.ABORTED,
            "The MAL token request was cancelled."
        );
    }
    if (axios.isAxiosError(error)) {
        if (error.response?.status !== undefined) {
            const apiError = new AniLinkApiError(error.response.status, error.response.data);
            apiError.message = `MAL token request failed with status ${error.response.status}.`;
            return apiError;
        }
        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
            return new AniLinkNetworkError(
                AniLinkErrorCodes.TIMEOUT,
                "The MAL token request timed out."
            );
        }
        return new AniLinkNetworkError(
            AniLinkErrorCodes.NETWORK,
            "The MAL token request failed due to a network error."
        );
    }
    return new AniLinkError("The MAL token request failed.", AniLinkErrorCodes.UNKNOWN);
};

/**
 * Sends one MyAnimeList OAuth2 token request through the shared transport.
 *
 * Runs form-urlencoded POSTs against {@link MAL_TOKEN_URL} with the shared
 * pipeline's retry policy and hooks, defaulting to a shorter timeout than
 * REST operations (`MAL_AUTH_TIMEOUT_MS`) because a hung token exchange
 * blocks the whole login flow. Failures are re-thrown as the sanitized error
 * from `normalizeMalTokenError` so no credentials leak through error payloads.
 *
 * @param params - The URL-encoded grant fields (`grant_type`, `client_id`, and code, verifier, or refresh token as applicable).
 * @param options - Optional transport settings for the token call; `timeout` defaults to `MAL_AUTH_TIMEOUT_MS`.
 * @returns The parsed {@link MalTokenResponse} on success.
 * @throws An {@link AniLinkApiError} when MAL rejects the grant, or an {@link AniLinkNetworkError} on timeout, cancellation, or network failure.
 */
const requestMalToken = async (
    params: Record<string, string>,
    options?: RequestOptions
): Promise<MalTokenResponse> => {
    try {
        return await sendRequest<MalTokenResponse>(
            MAL_TOKEN_URL,
            "POST",
            new URLSearchParams(params).toString() as unknown as object,
            undefined,
            false,
            {
                ...options,
                timeout: options?.timeout ?? MAL_AUTH_TIMEOUT_MS,
                exposeRawAxiosError: false,
            },
            undefined,
            "application/x-www-form-urlencoded"
        );
    } catch (error) {
        throw normalizeMalTokenError(error);
    }
};

/**
 * {@link getMalAccessToken} exchanges a MAL authorization code for an access token through PKCE.
 *
 * It completes the flow started by {@link buildMalAuthorizationUrl} using the {@link MalAuthorizationCodeRequest} fields and returns a {@link MalTokenResponse} consumed by `MalCredentials` and `buildMyAnimeListApi`. Transport is shared with {@link RequestOptions}.
 *
 * @param request - The authorization-code fields and optional transport settings; a {@link MalAuthorizationCodeRequest}.
 * @returns The {@link MalTokenResponse} for the authenticated session.
 * @throws An {@link AniLinkApiError} or {@link AniLinkNetworkError} with sanitized token-request details.
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
    requestMalToken(
        {
            client_id: request.clientId,
            code: request.code,
            code_verifier: request.codeVerifier,
            grant_type: "authorization_code",
            ...(request.clientSecret === undefined ? {} : { client_secret: request.clientSecret }),
        },
        request.options
    );

/**
 * {@link refreshMalAccessToken} exchanges a MAL refresh token for a new access token.
 *
 * It uses the {@link MalRefreshTokenRequest} fields from a prior {@link MalTokenResponse} and returns a fresh {@link MalTokenResponse} for `MalCredentials` and `buildMyAnimeListApi`. Transport is shared with {@link RequestOptions}.
 *
 * @param request - The refresh-token fields and optional transport settings; a {@link MalRefreshTokenRequest}.
 * @returns The refreshed {@link MalTokenResponse}.
 * @throws An {@link AniLinkApiError} or {@link AniLinkNetworkError} with sanitized token-request details.
 * @example
 * ```typescript
 * const token = await refreshMalAccessToken({ clientId, refreshToken });
 * // token.access_token -> replace the stored MalCredentials.accessToken
 * ```
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const refreshMalAccessToken = (request: MalRefreshTokenRequest): Promise<MalTokenResponse> =>
    requestMalToken(
        {
            client_id: request.clientId,
            grant_type: "refresh_token",
            refresh_token: request.refreshToken,
            ...(request.clientSecret === undefined ? {} : { client_secret: request.clientSecret }),
        },
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
 * @example
 * ```typescript
 * const expiresAt = getMalTokenExpiry(token);
 * if (expiresAt.getTime() - Date.now() < 60_000) await refreshMalAccessToken({ clientId, refreshToken });
 * ```
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const getMalTokenExpiry = (response: MalTokenResponse, now: number = Date.now()): Date =>
    new Date(now + response.expires_in * 1000);
