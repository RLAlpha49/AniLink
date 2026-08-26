import {
    type AniLinkOptions,
    buildAniListApi,
    type AniListApi,
} from "./apis/graphql/anilist/facade";
import { type AniLinkCredentials, resolveProviderCredentials } from "./base/credentials";

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
} from "./base/credentials";

/**
 * `AniLink` is a class for interacting with the APIs.
 * It provides methods for querying and mutating data.
 */
export class AniLink {
    /**
     * Anilist API methods.
     * @public
     */
    public anilist: AniListApi;

    /**
     * MyAnimeList API methods. Populated once the MAL provider module ships;
     * the constructor already accepts and stores MAL credentials so adding
     * the provider requires no further constructor change.
     */
    public mal?: unknown;

    /**
     * Creates a new AniLink instance. The `authToken` parameter is optional and only required for authenticated queries and mutations. If no `authToken` is provided, only public queries will be available. You are able to create multiple AniLink instances with different `authToken`s.
     *
     * Alternatively, pass a per-provider credentials object: each provider
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
    constructor(
        authToken?: string | AniLinkCredentials,
        options?: AniLinkOptions & Partial<Record<never, never>>
    ) {
        if (typeof authToken === "string" || authToken === undefined) {
            this.anilist = buildAniListApi(authToken, options);
            return;
        }
        const anilistCredentials = resolveProviderCredentials(authToken.anilist);
        this.anilist = buildAniListApi(anilistCredentials?.authToken, anilistCredentials);
    }
}
