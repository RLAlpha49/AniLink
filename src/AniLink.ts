import { type AniLinkOptions, type AniListApi } from "./apis/graphql/anilist/facade";
import { buildProviderClients } from "./providers/registry";
import type { MyAnimeListApi } from "./apis/rest/mal/facade";
import type { AniLinkCredentials } from "./base/credentials";

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
} from "./base/AniLinkError";
export type { AniLinkErrorCode, RateLimitInfo } from "./base/AniLinkError";

export { paginate, paginateChunks, paginatePages } from "./apis/graphql/anilist/Paginator";
export type {
    ChunkPaginateOptions,
    ChunkPaginateResult,
    PaginateOptions,
    PaginateResult,
} from "./apis/graphql/anilist/Paginator";

export type {
    AniLinkCredentials,
    AniListCredentials,
    MalCredentials,
    ProviderCredentials,
    ResolvedProviderCredentials,
} from "./base/credentials";
export type { RequestAuth, RequestAuthInput } from "./base/RequestHandler";
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
     * @param {AniLinkOptions | AniLinkCredentials} [options] - Transport settings scoped to this instance: `timeout`, `signal` cancellation, automatic retries under the default policy (`retry: false` opts out), opt-in `paceWithRateLimit` pacing and `circuitBreaker` fast-fail, the `onError`/`onRetry`/`onRequestStart`/`onResponse` observability hooks, and `exposeRawAxiosError` debugging. Options never leak between instances. When the first argument is a credentials object, this parameter is unused (transport settings belong inside each provider's credentials).
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
            clients = buildProviderClients(authToken);
        }
        this.anilist = clients.anilist;
        this.mal = clients.mal;
    }
}
