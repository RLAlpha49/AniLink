/**
 * AniList provider surface.
 *
 * This barrel is the canonical import point for everything AniList-specific:
 * the composed facade type, the transport options shared by every provider,
 * the AniList OAuth helpers, and the AniList pagination contracts. The root
 * entry (`anilink`) re-exports all of it for convenience; this subpath exists
 * so consumers can scope their imports to one provider.
 */
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

export type { AniListApi, AniLinkOptions } from "./apis/graphql/anilist/facade";

export { AniLink } from "./AniLink";
