import {
    type AniLinkOptions,
    buildAniListApi,
    type AniListApi,
} from "./apis/graphql/anilist/facade";

export type { AniLinkOptions } from "./apis/graphql/anilist/facade";

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
     * Creates a new AniLink instance. The `authToken` parameter is optional and only required for authenticated queries and mutations. If no `authToken` is provided, only public queries will be available. You are able to create multiple AniLink instances with different `authToken`s.
     * @param {string} [authToken] - The authentication token to use for API requests.
     * @param {AniLinkOptions} [options] - Transport settings scoped to this instance: `timeout`, `signal` cancellation, automatic retries under the default policy (`retry: false` opts out), opt-in `paceWithRateLimit` pacing and `circuitBreaker` fast-fail, the `onError`/`onRetry`/`onRequestStart`/`onResponse` observability hooks, and `exposeRawAxiosError` debugging. Options never leak between instances.
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
     * ```
     */
    constructor(authToken?: string, options?: AniLinkOptions) {
        this.anilist = buildAniListApi(authToken, options);
    }
}
