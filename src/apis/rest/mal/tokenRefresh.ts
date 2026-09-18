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
import { type AniLinkError, AniLinkApiError, AniLinkAuthError } from "../../../base/AniLinkError";
import type { OnHookErrorHandler, RequestAuthInput } from "../../../base/RequestHandler";
import { type DiagnosticsMode, resolveDiagnosticsMode } from "../../../base/transportTypes";
import { reportDiagnostic, safeInvoke } from "../../../base/hooks";
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
 * Callback invoked when an automatic token-refresh grant fails.
 *
 * The callback fires exactly once per failed grant — concurrent 401s share
 * one in-flight grant and one failure event. It receives the sanitized
 * refresh error (an {@link AniLinkError} carrying the upstream `status` and
 * `code`), the same error the awaiting caller catches. Exceptions thrown by
 * the callback are reported through `onHookError` (falling back to a console
 * warning) and never replace the propagated refresh error.
 *
 * @see {@link MalTokenRefresher}
 */
export type MalTokenRefreshErrorCallback = (error: AniLinkError) => void;

/**
 * Builds the coordinator's dependencies.
 *
 * @see {@link MalTokenRefresher}
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
 * Coordinates the automatic MAL token-refresh lifecycle for one client.
 *
 * The wiring seam constructs one coordinator per `MyAnimeListApi` when refresh
 * credentials are present and wraps every facade method with
 * {@link MalTokenRefresher.executeWithRefresh}. The coordinator owns the
 * mutable refresh state (the current refresh token, honoring MAL's rotation
 * semantics) and deduplicates concurrent 401s into a single refresh call.
 *
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export class MalTokenRefresher {
    private readonly clientId: string;
    private readonly clientSecret: string | undefined;
    private refreshToken: string;
    private readonly onTokenRefresh?: MalTokenRefreshCallback;
    private readonly onTokenRefreshError?: MalTokenRefreshErrorCallback;
    private readonly onHookError: OnHookErrorHandler | undefined;
    private readonly diagnostics: DiagnosticsMode;
    private readonly applyAccessToken: (accessToken: string) => void;
    private refreshInFlight: Promise<MalTokenResponse> | undefined;

    /**
     * Constructs a refresh coordinator from the credential slot fields.
     *
     * @param options - The refresh grant fields, the auth-swap callback, the optional persistence and failure callbacks, and the diagnostics mode.
     * @throws A `TypeError` when `options.diagnostics` is defined but not one of `"warn"`, `"hook"`, or `"silent"`.
     */
    constructor(options: MalTokenRefresherOptions) {
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;
        this.refreshToken = options.refreshToken;
        this.onTokenRefresh = options.onTokenRefresh;
        this.onTokenRefreshError = options.onTokenRefreshError;
        this.onHookError = options.onHookError;
        this.diagnostics = resolveDiagnosticsMode(options.diagnostics);
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
     * — surfaces unchanged. A failed refresh grant is reported to
     * `onHookError` (under the `malTokenRefresh` hook name) before the
     * sanitized error rethrows, so the grant failure is observable through
     * the same channel as every other lifecycle failure. The
     * `onTokenRefreshError` callback (when configured) fires once per failed
     * grant with the same sanitized error.
     *
     * @param operation - A closure performing one request attempt; called at most twice.
     * @returns The first successful attempt's result.
     * @throws The sanitized refresh error when the token endpoint rejects the grant, or the operation's own error otherwise.
     */
    public async executeWithRefresh<T>(operation: () => Promise<T>): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            // AniLinkRestError extends AniLinkApiError (pinned by test), so
            // one instanceof check covers both REST and GraphQL 401s, and
            // `status` is always a number on the base class.
            const isExpiredToken = error instanceof AniLinkApiError && error.status === 401;
            const isMissingToken = error instanceof AniLinkAuthError;
            if (!isExpiredToken && !isMissingToken) {
                throw error;
            }
            try {
                await this.refresh();
            } catch (refreshError) {
                // The refresh grant runs outside the transport pipeline, so
                // its failure would otherwise bypass the onError/onRetry
                // observability entirely. Report it through the structured
                // diagnostic emit path before rethrowing the sanitized
                // error. The diagnostic carries its own `token-refresh`
                // kind — a failed grant is not a hook failure, and `kind` is
                // the machine key consumers switch on — and the observer
                // receives the sanitized refresh error itself as the
                // `cause`, so its `status`/`code` stay inspectable. The
                // console fallback is skipped: the caller receives the
                // failure once, as the rejection they already handle.
                reportDiagnostic({
                    kind: "token-refresh",
                    hookName: "malTokenRefresh",
                    message: `The MAL token refresh failed: ${
                        refreshError instanceof Error ? refreshError.message : String(refreshError)
                    }`,
                    onHookError: this.onHookError,
                    diagnostics: this.diagnostics,
                    rawError: refreshError,
                    rethrown: true,
                });
                throw refreshError;
            }
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
                .catch((error: unknown) => {
                    // Fires once per failed grant: concurrent 401s share the
                    // in-flight promise, so they share one failure event,
                    // mirroring the success callback's once-per-grant
                    // contract. A throwing observer of this event is itself
                    // reported through `onHookError`; the sanitized refresh
                    // error still propagates to every awaiting caller. The
                    // catch binds to performRefresh alone so exceptions
                    // from the auth swap or the success callback below —
                    // not grant failures — propagate without this
                    // reporting.
                    safeInvoke(
                        this.onTokenRefreshError,
                        "onTokenRefreshError",
                        this.onHookError,
                        this.diagnostics,
                        error
                    );
                    throw error;
                })
                .then((response) => {
                    this.applyAccessToken(response.access_token);
                    safeInvoke(
                        this.onTokenRefresh,
                        "onTokenRefresh",
                        this.onHookError,
                        this.diagnostics,
                        response
                    );
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
