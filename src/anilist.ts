/**
 * AniList provider surface.
 *
 * This barrel is the canonical import point for everything AniList-specific:
 * the composed facade type, the transport options shared by every provider,
 * the AniList OAuth helpers, and the AniList pagination contracts. The root
 * entry (`anilink-api-wrapper`) re-exports all of it for convenience; this
 * subpath exists so consumers can scope their imports to one provider.
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
} from "./errors";
export type { AniLinkErrorCode, RateLimitInfo } from "./errors";
export type { RequestAuth, RequestAuthInput, RequestOptions } from "./errors";

export { paginate, paginateChunks, paginatePages } from "./apis/graphql/anilist/Paginator";
export type {
    ChunkPaginateOptions,
    ChunkPaginateResult,
    PaginateOptions,
    PaginateResult,
} from "./apis/graphql/anilist/Paginator";
export type { CustomPageOptions } from "./apis/graphql/anilist/CustomRequest";
export type { AniListTokenRefreshCallback } from "./apis/graphql/anilist/tokenRefresh";
export type { AniListTokenRefreshErrorCallback } from "./apis/graphql/anilist/tokenRefresh";
export { crossLink } from "./apis/graphql/anilist/helpers/crossLink";
export type { CrossLinkMedia, CrossLinkResult } from "./apis/graphql/anilist/helpers/crossLink";
export { mapExternalIds } from "./apis/graphql/anilist/helpers/mapExternalIds";
export type {
    MapExternalIdsOptions,
    MapExternalIdsResult,
    MapExternalIdsSource,
} from "./apis/graphql/anilist/helpers/mapExternalIds";
export { fuzzyDate } from "./apis/graphql/anilist/helpers/fuzzyDate";
export type { FuzzyDateOptions } from "./apis/graphql/anilist/helpers/fuzzyDate";
export { fuzzyDateInt } from "./apis/graphql/anilist/helpers/fuzzyDateInt";

export type { AniListApi, AniLinkOptions } from "./apis/graphql/anilist/facade";

export { AniLink } from "./AniLink";
