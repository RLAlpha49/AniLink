/**
 * MyAnimeList provider barrel.
 *
 * This subpath is the canonical import point for the MAL REST surface and its
 * provider-owned OAuth helpers.
 */
export { AniLink } from "./AniLink";
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
export type {
    MyAnimeListAnimeApi,
    MyAnimeListApi,
    MyAnimeListUserApi,
} from "./apis/rest/mal/facade";
export type { MalAnime, MalPicture, MalRequestOptions, MalUser } from "./apis/rest/mal/types";
export type { AniLinkCredentials, MalCredentials, ProviderCredentials } from "./base/credentials";
export type { RequestAuth, RequestAuthInput, RequestOptions } from "./base/RequestHandler";
