/**
 * The shared automatic token-refresh lifecycle.
 *
 * One coordinator implements the whole lifecycle — the 401/missing-token
 * classifier, the deduplicated in-flight grant, the auth swap, the
 * persistence and failure callbacks, the diagnostics routing, and the
 * single replay — for every OAuth provider. Providers contribute only the
 * exchange itself through the {@link TokenExchange} seam: a function that
 * runs their refresh grant. The provider wirings construct one coordinator
 * per client and wrap every facade method with
 * {@link TokenRefresher.executeWithRefresh}.
 */
import { type AniLinkError, AniLinkApiError, AniLinkAuthError } from "./AniLinkError";
import {
    type DiagnosticsMode,
    type OnHookErrorHandler,
    resolveDiagnosticsMode,
} from "./transportTypes";
import { reportDiagnostic, safeInvoke } from "./hooks";

/**
 * The shape every provider's token response satisfies: a fresh access
 * token plus an optional rotated refresh token.
 *
 * @see {@link TokenExchange}
 */
export interface TokenGrantResponse {
    /** The fresh bearer access token. */
    access_token: string;
    /** The rotated refresh token, when the provider issues one. */
    refresh_token?: string;
}

/**
 * The provider identity a refresh coordinator reports under: the hook name
 * its grant failures are attributed to and the label interpolated into the
 * refresh-failure message. A discriminated union so the two fields cannot
 * drift apart — `"AniList"` with `"malTokenRefresh"` does not compile.
 *
 * @see {@link TokenRefresherOptions.provider}
 */
export type TokenRefreshProvider =
    | { readonly hookName: "aniListTokenRefresh"; readonly providerLabel: "AniList" }
    | { readonly hookName: "malTokenRefresh"; readonly providerLabel: "MAL" };

/**
 * The provider's refresh grant, behind the coordinator's seam.
 *
 * An adapter receives the current refresh token and returns the provider's
 * token response. The adapter owns the provider's grant shape — AniList
 * requires the client secret, MAL makes it optional — and the sanitized
 * error it throws is the error the awaiting caller catches.
 *
 * @see {@link TokenRefresher}
 */
export type TokenExchange<TToken extends TokenGrantResponse> = (
    refreshToken: string
) => Promise<TToken>;

/**
 * Builds the coordinator's dependencies.
 *
 * @see {@link TokenRefresher}
 */
export interface TokenRefresherOptions<TToken extends TokenGrantResponse> {
    /**
     * The provider's refresh grant, behind the coordinator's seam. Runs
     * once per deduplicated grant; its sanitized error is the error the
     * awaiting caller catches.
     */
    exchange: TokenExchange<TToken>;
    /** The stored refresh token exchanged for new access tokens. */
    refreshToken: string;
    /**
     * The provider identity for diagnostics: the hook name its grant
     * failures are reported under (for example `"aniListTokenRefresh"` or
     * `"malTokenRefresh"`) and the label interpolated into the
     * refresh-failure message, bound together by {@link TokenRefreshProvider}.
     */
    provider: TokenRefreshProvider;
    /** Optional callback invoked once after every successful refresh. */
    onTokenRefresh?: (response: TToken) => void;
    /** Optional callback invoked once when a refresh grant fails. */
    onTokenRefreshError?: (error: AniLinkError) => void;
    /** Optional observer for `onTokenRefresh` failures, mirroring the transport hooks. */
    onHookError?: OnHookErrorHandler;
    /** How a throwing `onTokenRefresh` callback with no observer is reported; defaults to `"warn"`. */
    diagnostics?: DiagnosticsMode;
    /**
     * Swaps the fresh access token onto the operation instances. Called
     * between the refresh and the replay so the replayed request carries the
     * new auth material. The callback must write through the wiring's live
     * auth cell (not a construction-time snapshot) so both already-
     * constructed operations and instances built later see the refreshed
     * token.
     */
    applyAccessToken: (accessToken: string) => void;
}

/**
 * Coordinates the automatic token-refresh lifecycle for one client.
 *
 * The wiring seam constructs one coordinator per provider facade when
 * refresh credentials are present and wraps every facade method with
 * {@link TokenRefresher.executeWithRefresh}. The coordinator owns the
 * mutable refresh state (the current refresh token, honoring the
 * provider's rotation semantics) and deduplicates concurrent 401s into a
 * single refresh call.
 *
 * @see {@link TokenExchange}
 */
export class TokenRefresher<TToken extends TokenGrantResponse> {
    private readonly exchange: TokenExchange<TToken>;
    private refreshToken: string;
    private readonly provider: TokenRefreshProvider;
    private readonly onTokenRefresh?: (response: TToken) => void;
    private readonly onTokenRefreshError?: (error: AniLinkError) => void;
    private readonly onHookError: OnHookErrorHandler | undefined;
    private readonly diagnostics: DiagnosticsMode;
    private readonly applyAccessToken: (accessToken: string) => void;
    private refreshInFlight: Promise<TToken> | undefined;

    /**
     * Constructs a refresh coordinator from the wiring's fields.
     *
     * @param options - The exchange adapter, the stored refresh token, the diagnostics names, the auth-swap callback, the optional persistence and failure callbacks, and the diagnostics mode.
     * @throws A `TypeError` when `options.diagnostics` is defined but not one of `"warn"`, `"hook"`, or `"silent"`.
     */
    constructor(options: TokenRefresherOptions<TToken>) {
        this.exchange = options.exchange;
        this.refreshToken = options.refreshToken;
        this.provider = options.provider;
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
     * before any request because no access token is configured, which lets
     * a persisted refresh token bootstrap the client — triggers exactly one
     * refresh (concurrent failures share the in-flight refresh) followed by
     * a single replay with the new auth material. Any other failure — a
     * non-401 first attempt, a failed refresh, or a replay that fails again
     * — surfaces unchanged. A failed refresh grant is reported to
     * `onHookError` (under the coordinator's `hookName`) before the
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
            // AniLinkGraphQLError and AniLinkRestError both extend
            // AniLinkApiError (pinned by test), so one instanceof check
            // covers the GraphQL and REST 401s, and `status` is always a
            // number on the base class.
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
                    hookName: this.provider.hookName,
                    message: `The ${this.provider.providerLabel} token refresh failed: ${
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
     * @returns The effective token response, with `refresh_token` filled in when the provider omitted it.
     */
    private async refresh(): Promise<TToken> {
        if (this.refreshInFlight === undefined) {
            this.refreshInFlight = this.performRefresh()
                .catch((error: AniLinkError) => {
                    // Fires once per failed grant: concurrent 401s share the
                    // in-flight promise, so they share one failure event,
                    // mirroring the success callback's once-per-grant
                    // contract. A throwing observer of this event is itself
                    // reported through `onHookError`; the sanitized refresh
                    // error still propagates to every awaiting caller. The
                    // catch binds to performRefresh alone so exceptions
                    // from the auth swap or the success callback below —
                    // not grant failures — propagate without this
                    // reporting. The parameter type states the exchange
                    // seam's contract: `performRefresh` only awaits the
                    // exchange, and the exchange throws sanitized
                    // `AniLinkError` rejections.
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
    private async performRefresh(): Promise<TToken> {
        const response = await this.exchange(this.refreshToken);
        this.refreshToken = response.refresh_token ?? this.refreshToken;
        return { ...response, refresh_token: this.refreshToken };
    }
}
