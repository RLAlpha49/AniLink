/**
 * The shared OAuth token-grant transport, expiry, auth rewrite, and
 * automatic token-refresh lifecycle.
 *
 * One coordinator implements the whole lifecycle — the 401/missing-token
 * classifier, the deduplicated in-flight grant, the auth swap, the
 * persistence and failure callbacks, the diagnostics routing, and the
 * single replay — for every OAuth provider, and the same module runs the
 * grant itself ({@link requestTokenGrant}), computes token expiry
 * ({@link computeTokenExpiry}), and rebuilds auth material for the replay
 * ({@link rewriteAuth}). Providers contribute only data: a
 * {@link TokenGrantDescriptor} naming their token endpoint, sanitize
 * label, strip rule, and diagnostics identity. The provider wirings
 * construct one coordinator per client and wrap every facade method with
 * {@link TokenRefresher.executeWithRefresh}.
 */
import { type AniLinkError, AniLinkApiError, AniLinkAuthError } from "./AniLinkError";
import {
    type DiagnosticsMode,
    type OnHookErrorHandler,
    resolveDiagnosticsMode,
} from "./transportTypes";
import { reportDiagnostic, safeInvoke } from "./hooks";
import { type RequestAuthInput, type RequestOptions, sendRequest } from "./RequestHandler";
import { sanitizeTokenError } from "./tokenError";

/**
 * The shape every provider's token response satisfies: a fresh access
 * token plus an optional rotated refresh token.
 *
 * @see {@link requestTokenGrant}
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
 * @see {@link TokenGrantDescriptor.provider}
 */
export type TokenRefreshProvider =
    | { readonly hookName: "aniListTokenRefresh"; readonly providerLabel: "AniList" }
    | { readonly hookName: "malTokenRefresh"; readonly providerLabel: "MAL" };

/**
 * The provider-specific facts behind every token grant and the
 * post-refresh replay: the token endpoint the grant posts to, the label
 * grant failures are sanitized under, the headers the replay drops, and
 * the diagnostics identity the coordinator reports under. Each provider
 * declares one descriptor; the shared transport, the auth rewrite, and
 * the refresh coordinator read their behaviour from it, so a provider
 * shell carries data instead of logic.
 *
 * @see {@link TokenRefreshProvider}
 */
export interface TokenGrantDescriptor {
    /** The OAuth token endpoint grants POST to (for example `https://anilist.co/api/v2/oauth/token`). */
    readonly tokenUrl: string;
    /** The context label prefixed to sanitized grant failures (for example `"AniList token request"`). */
    readonly errorLabel: string;
    /** Headers removed from auth material when the replay rewrites it: MAL drops `X-MAL-CLIENT-ID`, AniList drops nothing. */
    readonly stripHeaders: readonly string[];
    /** The provider identity for diagnostics, bound together by {@link TokenRefreshProvider}. */
    readonly provider: TokenRefreshProvider;
}

/**
 * Default timeout applied to OAuth token requests when the caller does not
 * configure one. Token requests run through the shared transport pipeline
 * and inherit its retry policy, hooks, and cancellation, but default to a
 * shorter timeout than operations because a hung token exchange blocks the
 * whole login or replay flow.
 */
const TOKEN_REQUEST_TIMEOUT_MS = 10_000;

/**
 * Runs one form-encoded OAuth token grant through the shared transport.
 *
 * Both providers' grants — the authorization-code exchange and the refresh
 * grant — post `application/x-www-form-urlencoded` fields to the
 * descriptor's token endpoint with one policy: a short timeout, retries off
 * by default because grant credentials are single-use (a retried
 * authorization code or PKCE verifier is consumed server-side, so the retry
 * is guaranteed to fail again while doubling token-endpoint traffic; a
 * caller opts back in with an explicit `retry` policy), and
 * `exposeRawAxiosError` forced off because the request body carries
 * `client_secret`, authorization `code`, and `refresh_token` values.
 * Failures are rethrown through `sanitizeTokenError` under the
 * descriptor's `errorLabel`, so error payloads never leak credentials.
 *
 * @param descriptor - The provider descriptor naming the token endpoint and the sanitize label.
 * @param params - The URL-encoded grant fields (`grant_type`, `client_id`, and the code, verifier, or refresh token as applicable).
 * @param signal - Optional `AbortSignal` to cancel the grant while it is in flight; takes precedence over `options.signal` when both are given.
 * @param options - Optional transport settings for the grant call; `timeout` defaults to `TOKEN_REQUEST_TIMEOUT_MS` (10 seconds) and `retry` defaults to disabled. Pass an explicit `retry` policy to opt back in.
 * @returns The parsed token response on success.
 * @throws An `AniLinkApiError` when the provider rejects the grant, or an `AniLinkNetworkError` on transport failure; both are sanitized before they surface.
 */
export const requestTokenGrant = async <TToken extends TokenGrantResponse>(
    descriptor: TokenGrantDescriptor,
    params: Record<string, string>,
    signal?: AbortSignal,
    options?: RequestOptions
): Promise<TToken> => {
    try {
        const body = new URLSearchParams(params).toString();
        return await sendRequest<TToken>(descriptor.tokenUrl, "POST", body, undefined, {
            requiresAuth: false,
            options: {
                ...options,
                timeout: options?.timeout ?? TOKEN_REQUEST_TIMEOUT_MS,
                retry: options?.retry ?? false,
                signal: signal ?? options?.signal,
                // Never honor a caller's exposeRawAxiosError here: the
                // grant body carries client secrets and one-time codes.
                exposeRawAxiosError: false,
            },
            contentType: "application/x-www-form-urlencoded",
        });
    } catch (error) {
        throw sanitizeTokenError(error, descriptor.errorLabel);
    }
};

/**
 * Builds the standard refresh-grant fields every provider shares.
 *
 * Both providers speak the standard OAuth `refresh_token` grant: the
 * client identity, the stored refresh token, and the client secret when
 * one is configured (AniList's grant requires it and the lifecycle only
 * activates with it; MAL's is optional and the key is omitted entirely
 * when absent).
 *
 * @param clientId - The application client ID.
 * @param clientSecret - The application secret, when the grant uses one.
 * @param refreshToken - The stored refresh token exchanged for new access tokens.
 * @returns The unencoded grant fields, ready for {@link requestTokenGrant}.
 */
export const refreshGrantParams = (
    clientId: string,
    clientSecret: string | undefined,
    refreshToken: string
): Record<string, string> => ({
    grant_type: "refresh_token",
    client_id: clientId,
    ...(clientSecret !== undefined ? { client_secret: clientSecret } : {}),
    refresh_token: refreshToken,
});

/**
 * Computes the absolute expiry time of a token response.
 *
 * Shared by both providers' expiry helpers so the validation and the
 * arithmetic live in one place.
 *
 * @param response - The token response to compute the expiry for.
 * @param now - The current time in milliseconds since the Unix epoch. Defaults to the time at which the helper is called.
 * @returns The moment the access token expires.
 * @throws A `TypeError` when `expires_in` is not a positive finite number — `0`, negative, `NaN`, or `Infinity` values produce an already-expired or nonsensical expiry that silently breaks proactive-refresh scheduling (and is one comparison-operator slip away from a refresh loop), so they are rejected instead.
 */
export const computeTokenExpiry = (
    response: { readonly expires_in: number },
    now: number = Date.now()
): Date => {
    const { expires_in } = response;
    if (!Number.isFinite(expires_in) || expires_in <= 0) {
        throw new TypeError(
            `Invalid expires_in ${expires_in}: token lifetime must be a finite, positive number of seconds.`
        );
    }
    return new Date(now + expires_in * 1000);
};

/**
 * Builds the auth material an operation replays with after a refresh.
 *
 * The swap replaces the bearer token with the fresh one, preserves the
 * other headers the caller attached to structured auth (a proxy header, a
 * tracing header keeps working after the first refresh instead of
 * silently disappearing mid-lifetime), and drops the headers the
 * descriptor lists — MAL strips its client-ID header because the replayed
 * request authenticates with the bearer token and a stale client-ID
 * header would widen client-ID exposure to intermediaries that log
 * request headers. A headers object that ends up empty collapses to no
 * headers.
 *
 * @param descriptor - The provider descriptor whose `stripHeaders` rule the rewrite applies.
 * @param auth - The operation's current auth material, read live at swap time so auth changed through any other path survives the replay.
 * @param accessToken - The fresh access token from the refresh grant.
 * @returns The replacement {@link RequestAuthInput}.
 */
export const rewriteAuth = (
    descriptor: TokenGrantDescriptor,
    auth: RequestAuthInput | undefined,
    accessToken: string
): RequestAuthInput => {
    const headers =
        typeof auth === "object" && auth?.headers !== undefined
            ? Object.fromEntries(
                  Object.entries(auth.headers).filter(
                      ([key]) => !descriptor.stripHeaders.includes(key)
                  )
              )
            : undefined;
    return {
        token: accessToken,
        headers: headers !== undefined && Object.keys(headers).length > 0 ? headers : undefined,
    };
};

/**
 * The wiring-facing fields every provider's refresher options share: the
 * client credentials behind the refresh grant, the optional persistence
 * and failure callbacks, and the auth swap. Provider option interfaces
 * extend this and narrow what their grant requires (AniList makes
 * `clientSecret` mandatory).
 *
 * @see {@link TokenRefresher}
 */
export interface TokenRefreshOptions<TToken extends TokenGrantResponse> {
    /** The application client ID sent on the refresh grant. */
    clientId: string;
    /** The application secret sent on the refresh grant, when the provider's grant accepts one. */
    clientSecret?: string;
    /** The stored refresh token exchanged for new access tokens. */
    refreshToken: string;
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
 * Builds the coordinator's dependencies: the shared option shape plus the
 * provider descriptor the coordinator's grant, diagnostics, and replay
 * rewrite read.
 *
 * @see {@link TokenRefresher}
 */
export interface TokenRefresherOptions<
    TToken extends TokenGrantResponse,
> extends TokenRefreshOptions<TToken> {
    /**
     * The provider descriptor behind the grant, the diagnostics identity,
     * and the replay's strip rule: token endpoint, sanitize label, header
     * rule, and hook identity.
     */
    descriptor: TokenGrantDescriptor;
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
 * @see {@link TokenGrantDescriptor}
 */
export class TokenRefresher<TToken extends TokenGrantResponse> {
    private readonly descriptor: TokenGrantDescriptor;
    private readonly clientId: string;
    private readonly clientSecret: string | undefined;
    private refreshToken: string;
    private readonly onTokenRefresh?: (response: TToken) => void;
    private readonly onTokenRefreshError?: (error: AniLinkError) => void;
    private readonly onHookError: OnHookErrorHandler | undefined;
    private readonly diagnostics: DiagnosticsMode;
    private readonly applyAccessToken: (accessToken: string) => void;
    private refreshInFlight: Promise<TToken> | undefined;

    /**
     * Constructs a refresh coordinator from the wiring's fields.
     *
     * @param options - The provider descriptor, the client credentials, the stored refresh token, the diagnostics names, the auth-swap callback, the optional persistence and failure callbacks, and the diagnostics mode.
     * @throws A `TypeError` when `options.diagnostics` is defined but not one of `"warn"`, `"hook"`, or `"silent"`.
     */
    constructor(options: TokenRefresherOptions<TToken>) {
        this.descriptor = options.descriptor;
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
                    hookName: this.descriptor.provider.hookName,
                    message: `The ${this.descriptor.provider.providerLabel} token refresh failed: ${
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
     * Runs the refresh grant against the descriptor's token endpoint and
     * stores the rotated refresh token.
     *
     * @returns The effective token response.
     */
    private async performRefresh(): Promise<TToken> {
        const response = await requestTokenGrant<TToken>(
            this.descriptor,
            refreshGrantParams(this.clientId, this.clientSecret, this.refreshToken)
        );
        this.refreshToken = response.refresh_token ?? this.refreshToken;
        return { ...response, refresh_token: this.refreshToken };
    }
}
