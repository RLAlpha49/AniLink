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

/** A successful MyAnimeList OAuth2 token response. */
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

/** Inputs for exchanging a MAL authorization code with PKCE. */
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

/** Inputs for refreshing a MAL access token. */
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
 * Builds a MAL OAuth2 PKCE authorization URL.
 *
 * @param clientId - The MAL application client ID.
 * @param codeChallenge - The S256 PKCE challenge generated for the login attempt.
 * @param state - Optional opaque CSRF state to validate on the redirect.
 * @returns The fully encoded authorization URL.
 * @example
 * ```typescript
 * const url = buildMalAuthorizationUrl("client-id", "pkce-challenge", "csrf-state");
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
 * Exchanges a MAL authorization code for an access token through PKCE.
 *
 * @param request - The authorization-code fields and optional transport settings.
 * @returns The MAL token response.
 * @throws An `AniLinkApiError` or `AniLinkNetworkError` with sanitized token-request details.
 * @example
 * ```typescript
 * const token = await getMalAccessToken({ clientId, code, codeVerifier });
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
 * Exchanges a MAL refresh token for a new access token.
 *
 * @param request - The refresh-token fields and optional transport settings.
 * @returns The MAL token response.
 * @throws An `AniLinkApiError` or `AniLinkNetworkError` with sanitized token-request details.
 * @example
 * ```typescript
 * const token = await refreshMalAccessToken({ clientId, refreshToken });
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
 * Computes the absolute expiry time of a MAL token response.
 *
 * @param response - The MAL token response.
 * @param now - The current time in milliseconds since the Unix epoch.
 * @returns The moment the access token expires.
 * @example
 * ```typescript
 * const expiresAt = getMalTokenExpiry(token);
 * ```
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const getMalTokenExpiry = (response: MalTokenResponse, now: number = Date.now()): Date =>
    new Date(now + response.expires_in * 1000);
