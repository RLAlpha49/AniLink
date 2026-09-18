import { type AniLinkOptions, type AniListApi } from "./apis/graphql/anilist/facade";
import { buildProviderClients } from "./providers/registry";
import type { MyAnimeListApi } from "./apis/rest/mal/facade";
import type { AniLinkCredentials } from "./base/credentials";
import { snapshotTransportState, type TransportStateSnapshot } from "./base/transportState";

export type { AniListApi, AniLinkOptions } from "./apis/graphql/anilist/facade";

export {
    ANILIST_AUTHORIZE_URL,
    ANILIST_TOKEN_URL,
    type AniListTokenResponse,
    buildAuthorizationUrl,
    getAccessToken,
    getTokenExpiry,
    refreshAccessToken,
} from "./apis/graphql/anilist/auth";

export {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
    AniLinkRestError,
    AniLinkValidationError,
} from "./errors";
export type { AniLinkErrorCode, RateLimitInfo } from "./errors";

export { paginate, paginateChunks, paginatePages } from "./apis/graphql/anilist/Paginator";
export type {
    ChunkPaginateOptions,
    ChunkPaginateResult,
    PaginateOptions,
    PaginateResult,
} from "./apis/graphql/anilist/Paginator";
export { crossLink } from "./apis/graphql/anilist/helpers/crossLink";
export type { CrossLinkMedia, CrossLinkResult } from "./apis/graphql/anilist/helpers/crossLink";
export { fuzzyDate } from "./apis/graphql/anilist/helpers/fuzzyDate";
export type { FuzzyDateOptions } from "./apis/graphql/anilist/helpers/fuzzyDate";
export { fuzzyDateInt } from "./apis/graphql/anilist/helpers/fuzzyDateInt";

export type {
    AniLinkCredentials,
    AniListCredentials,
    MalCredentials,
    ProviderCredentials,
    ResolvedProviderCredentials,
} from "./base/credentials";
export type {
    AniLinkDiagnostic,
    CircuitOpenContext,
    DiagnosticsMode,
    OnCircuitCloseHandler,
    OnCircuitOpenHandler,
    OnHookErrorHandler,
    OnPaceHandler,
    OnResponseHandler,
    RequestAuth,
    RequestAuthInput,
    RequestContext,
    RequestErrorContext,
    RequestOptions,
} from "./base/RequestHandler";
export { destroyCachedAgents } from "./base/RequestHandler";
export { ResponseCache } from "./base/responseCache";
export type { ResponseCacheOptions, ResponseCacheStats } from "./base/responseCache";
export { snapshotTransportState } from "./base/transportState";
export type {
    CircuitStateSnapshot,
    PaceDeadlineSnapshot,
    RetryBudgetSnapshot,
    TransportStateSnapshot,
} from "./base/transportState";
export { buildProviderClients } from "./providers/registry";
export type { ProviderClients, ProviderFactory, ProviderId } from "./providers/registry";
export {
    MAL_API_BASE_URL,
    MAL_API_REFERENCE,
    MAL_AUTHORIZE_URL,
    MAL_TOKEN_URL,
} from "./apis/rest/mal/constants";
export {
    buildMalAuthorizationUrl,
    getMalAccessToken,
    getMalTokenExpiry,
    refreshMalAccessToken,
} from "./apis/rest/mal/auth";
export type {
    MalAuthorizationCodeRequest,
    MalRefreshTokenRequest,
    MalTokenResponse,
} from "./apis/rest/mal/auth";
export type { MalTokenRefreshCallback } from "./apis/rest/mal/tokenRefresh";
export type { AniListTokenRefreshCallback } from "./apis/graphql/anilist/tokenRefresh";
export { buildMyAnimeListApi } from "./apis/rest/mal/wiring";
export type { MyAnimeListApi } from "./apis/rest/mal/facade";

/**
 * {@link AniLink} is the public entry point for interacting with the AniList GraphQL
 * and MyAnimeList REST APIs. A single instance composes an {@link AniListApi}
 * (under `anilist`) and a {@link MyAnimeListApi} (under `mal`), each keeping its
 * own credentials and transport settings.
 */
export class AniLink {
    /**
     * The AniList GraphQL API surface, a {@link AniListApi} composed from the
     * query, mutation, custom, and helper groups.
     * @public
     */
    public anilist: AniListApi;

    /** The MyAnimeList REST API methods, a {@link MyAnimeListApi} exposed under the `mal` namespace. */
    public mal: MyAnimeListApi;

    /** The per-provider state owners the clients key their shared transport state (breaker, budget, pacing) through. */
    private stateOwners: { anilist: object; mal: object };

    /**
     * Creates a new {@link AniLink} instance. The `authToken` parameter is optional and only
     * required for authenticated queries and mutations; without it only public queries are
     * available. Multiple instances can hold different `authToken`s, each exposing an
     * {@link AniListApi} under `anilist` and a {@link MyAnimeListApi} under `mal`.
     *
     * Alternatively, pass a per-provider {@link AniLinkCredentials} object: each provider
     * owns its own credentials shape, and credentials given under one key are
     * never applied to another provider's requests.
     * @param {string | AniLinkCredentials} [authToken] - The authentication token to use for AniList API requests, or a per-provider credentials object (`{ anilist?: …, mal?: … }`).
     * @param {AniLinkOptions} [options] - Transport settings scoped to this instance: `timeout`, `signal` cancellation, automatic retries under the default policy (`retry: false` opts out), `paceWithRateLimit` pacing (on by default), opt-in `circuitBreaker` fast-fail, the `onError`/`onRetry`/`onRequestStart`/`onResponse` observability hooks, and `exposeRawAxiosError` debugging. Options never leak between instances. Only valid when the first argument is a token string or omitted; combining a credentials object with a second argument throws, because the credentials form carries its own per-provider transport settings and a second argument would be silently dropped.
     * @throws {TypeError} When a per-provider credentials object is combined with a second `options` argument. The credentials form carries transport settings inside each provider slot, so the second argument would be silently ignored — the constructor rejects the ambiguous call instead.
     * @public
     * @example
     * ```typescript
     * const aniLink = new AniLink('authToken');
     *
     * const aniLink2 = new AniLink();
     *
     * // Per-instance transport settings:
     * const tuned = new AniLink('authToken', {
     *     timeout: 10_000,
     *     retry: false, // opt out of the default retry policy
     *     onResponse: ({ url, durationMs }) => console.log(url, durationMs),
     * });
     *
     * // Per-provider credentials (each provider keeps its own token):
     * const multi = new AniLink({
     *     anilist: { authToken: 'anilist-token', timeout: 5_000 },
     *     mal: { accessToken: 'mal-token' },
     * });
     * ```
     */
    constructor(authToken?: string | AniLinkCredentials, options?: AniLinkOptions) {
        let clients;
        if (typeof authToken === "string") {
            clients = buildProviderClients({ anilist: { authToken } }, options);
        } else if (authToken === undefined) {
            clients = buildProviderClients({}, options);
        } else {
            if (options !== undefined) {
                throw new TypeError(
                    "AniLink: when the first argument is a credentials object, transport settings belong inside each provider's credentials slot. Pass options as `new AniLink(credentials)` with per-slot settings, or use the legacy `new AniLink(token, options)` form."
                );
            }
            clients = buildProviderClients(authToken);
        }
        this.anilist = clients.anilist;
        this.mal = clients.mal;
        this.stateOwners = clients.stateOwners;
    }

    /**
     * Returns a read-only, point-in-time snapshot of each provider client's
     * shared transport state — the circuit-breaker scopes, retry-budget
     * window, and rate-limit pacing deadlines keyed through that client's
     * state owner — so "is the breaker open right now?", "how many budget
     * retries are spent?", and "when does the pacing deadline elapse?" can
     * be answered without pre-wiring lifecycle hooks.
     *
     * Each provider's snapshot is built by {@link snapshotTransportState},
     * which owns the read-only contract: deep-frozen copies that never
     * alias the live mutable state, and a build step that never mutates
     * the state it observes. Polling on a schedule is therefore safe
     * alongside live traffic.
     *
     * @returns A frozen per-provider {@link TransportStateSnapshot} pair:
     * `{ anilist: {...}, mal: {...} }`.
     * @example
     * ```typescript
     * const aniLink = new AniLink("token", {
     *     circuitBreaker: { threshold: 5, cooldownMs: 30_000 },
     * });
     *
     * // After some traffic:
     * const state = aniLink.getTransportState();
     * for (const breaker of state.anilist.circuit) {
     *     console.log(
     *         breaker.host,
     *         breaker.openedAt === null ? "closed" : `open since ${breaker.openedAt}`,
     *         `failures: ${breaker.consecutiveFailures}`
     *     );
     * }
     * if (state.anilist.retryBudget) {
     *     console.log("budget retries spent:", state.anilist.retryBudget.retriesUsed);
     * }
     * for (const deadline of state.anilist.paceDeadlines) {
     *     console.log("pacing until", new Date(deadline.deadlineMs).toISOString(), "for", deadline.host);
     * }
     * ```
     */
    public getTransportState(): { anilist: TransportStateSnapshot; mal: TransportStateSnapshot } {
        return Object.freeze({
            anilist: snapshotTransportState(this.stateOwners.anilist),
            mal: snapshotTransportState(this.stateOwners.mal),
        });
    }
}
