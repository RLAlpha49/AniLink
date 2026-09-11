/**
 * Automatic MAL token-refresh lifecycle.
 *
 * `MalCredentials.refreshToken` and `clientId` opt a client into the
 * automatic refresh path: when a REST operation fails with a 401 — or an
 * auth-required operation fails before any request because no access
 * token is configured — the coordinator exchanges the stored refresh token
 * for a fresh access token (once, deduplicated across concurrent failures),
 * swaps the stored auth material on the operation instances, and replays the
 * original request a single time. A replay that fails again surfaces that
 * error — there is no retry loop.
 */
import { AniLinkApiError, AniLinkAuthError } from "../../../base/AniLinkError";
import type { OnHookErrorHandler, RequestAuthInput } from "../../../base/RequestHandler";
import { safeInvoke } from "../../../base/hooks";
import { refreshMalAccessToken, type MalTokenResponse } from "./auth";

/**
 * Callback invoked after every successful automatic token refresh so callers
 * can persist the new access/refresh token pair.
 *
 * The callback fires exactly once per refresh grant — concurrent 401s share
 * one grant and one callback invocation. The response follows MAL's
 * rotation semantics: when the token endpoint omits `refresh_token`, the
 * coordinator keeps the stored one, and the response passed to the callback
 * carries the effective refresh token. Exceptions thrown by the callback are
 * reported through `onHookError` (falling back to a console warning) and
 * never abort the replayed request.
 *
 * @see {@link MalTokenResponse}
 */
export type MalTokenRefreshCallback = (response: MalTokenResponse) => void;

/**
 * Builds the coordinator's dependencies.
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
    /** Optional observer for `onTokenRefresh` failures, mirroring the transport hooks. */
    onHookError?: OnHookErrorHandler;
    /**
     * Swaps the fresh access token onto the operation instances. Called
     * between the refresh and the replay so the replayed request carries the
     * new auth material.
     */
    applyAccessToken: (accessToken: string) => void;
}

/**
 * Coordinates the automatic MAL token-refresh lifecycle for one client.
 *
 * The wiring seam constructs one coordinator per `MyAnimeListApi` when refresh
 * credentials are present and wraps every facade method with
 * {@link MalTokenRefresher.executeWithRefresh}. The coordinator owns the
 * mutable refresh state (the current refresh token, honoring MAL's rotation
 * semantics) and deduplicates concurrent 401s into a single refresh call.
 */
export class MalTokenRefresher {
    private readonly clientId: string;
    private readonly clientSecret: string | undefined;
    private refreshToken: string;
    private readonly onTokenRefresh?: MalTokenRefreshCallback;
    private readonly onHookError: OnHookErrorHandler | undefined;
    private readonly applyAccessToken: (accessToken: string) => void;
    private refreshInFlight: Promise<MalTokenResponse> | undefined;

    /**
     * Constructs a refresh coordinator from the credential slot fields.
     *
     * @param options - The refresh grant fields, the auth-swap callback, and the optional persistence callback.
     */
    constructor(options: MalTokenRefresherOptions) {
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;
        this.refreshToken = options.refreshToken;
        this.onTokenRefresh = options.onTokenRefresh;
        this.onHookError = options.onHookError;
        this.applyAccessToken = options.applyAccessToken;
    }

    /**
     * Runs one operation attempt under the automatic refresh lifecycle.
     *
     * A 401 from the first attempt — or an {@link AniLinkAuthError} raised
     * before any request because no access token is configured, which lets a
     * persisted refresh token bootstrap the client — triggers exactly one
     * refresh (concurrent failures share the in-flight refresh) followed by
     * a single replay with the new auth material. Any other failure — a
     * non-401 first attempt, a failed refresh, or a replay that fails again
     * — surfaces unchanged.
     *
     * @param operation - A closure performing one request attempt; called at most twice.
     * @returns The first successful attempt's result.
     * @throws The sanitized refresh error when the token endpoint rejects the grant, or the operation's own error otherwise.
     */
    public async executeWithRefresh<T>(operation: () => Promise<T>): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            const isExpiredToken = error instanceof AniLinkApiError && error.status === 401;
            const isMissingToken = error instanceof AniLinkAuthError;
            if (!isExpiredToken && !isMissingToken) {
                throw error;
            }
            await this.refresh();
            return await operation();
        }
    }

    /**
     * Performs one deduplicated refresh grant, applies the fresh access
     * token exactly once per grant, notifies the persistence callback, and
     * applies the rotation semantics: a response without `refresh_token`
     * keeps the stored one.
     *
     * The auth swap and the callback run inside the shared in-flight promise
     * so concurrent 401s observe one grant, one swap, and one callback
     * invocation — and so the swap always lands in grant order.
     *
     * @returns The effective token response, with `refresh_token` filled in when MAL omitted it.
     */
    private async refresh(): Promise<MalTokenResponse> {
        if (this.refreshInFlight === undefined) {
            this.refreshInFlight = this.performRefresh()
                .then((response) => {
                    this.applyAccessToken(response.access_token);
                    safeInvoke(this.onTokenRefresh, "onTokenRefresh", this.onHookError, response);
                    return response;
                })
                .finally(() => {
                    this.refreshInFlight = undefined;
                });
        }
        return await this.refreshInFlight;
    }

    /**
     * Runs the refresh grant and stores the rotated refresh token.
     *
     * @returns The effective token response.
     */
    private async performRefresh(): Promise<MalTokenResponse> {
        const response = await refreshMalAccessToken({
            clientId: this.clientId,
            refreshToken: this.refreshToken,
            clientSecret: this.clientSecret,
        });
        this.refreshToken = response.refresh_token ?? this.refreshToken;
        return { ...response, refresh_token: this.refreshToken };
    }
}

/**
 * Builds the auth material the operations replay with after a refresh.
 *
 * The token swap keeps the client-ID header from the original resolved auth
 * (it is constant for the client's lifetime) and replaces only the bearer
 * token.
 *
 * @param auth - The auth material the operations were constructed with.
 * @param accessToken - The fresh access token from the refresh grant.
 * @returns The replacement {@link RequestAuthInput}.
 */
export const buildRefreshedAuth = (
    auth: RequestAuthInput | undefined,
    accessToken: string
): RequestAuthInput => ({
    token: accessToken,
    headers:
        typeof auth === "object" && auth?.headers !== undefined ? { ...auth.headers } : undefined,
});
