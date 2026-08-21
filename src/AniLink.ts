import { type AniLinkOptions, buildAniListApi, type AniListApi } from "./apis/anilist/facade";

export {
    ANILIST_AUTHORIZE_URL,
    ANILIST_TOKEN_URL,
    type AniListTokenResponse,
    buildAuthorizationUrl,
    getAccessToken,
    refreshAccessToken,
} from "./auth/AniListAuth";

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
     * @param {AniLinkOptions} [options] - Timeout, cancellation, and debugging settings for API requests.
     * @public
     * @example
     * ```typescript
     * const aniLink = new AniLink('authToken');
     *
     * const aniLink2 = new AniLink();
     * ```
     */
    constructor(authToken?: string, options?: AniLinkOptions) {
        this.anilist = buildAniListApi(authToken, options);
    }
}
