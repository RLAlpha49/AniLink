/**
 * {@link MAL_API_BASE_URL} is the base URL for the MyAnimeList API v2 consumed by `MalAnimeOperation` and `MalUserOperation`.
 *
 * It is the prefix for the built-in REST calls exposed through `MyAnimeListApi`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export const MAL_API_BASE_URL = "https://api.myanimelist.net/v2";

/**
 * {@link MAL_AUTHORIZE_URL} is the MyAnimeList OAuth2 authorization endpoint used by `buildMalAuthorizationUrl`.
 *
 * It is the entry point for the PKCE flow that produces the code consumed by `getMalAccessToken`.
 *
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const MAL_AUTHORIZE_URL = "https://myanimelist.net/v1/oauth2/authorize";

/**
 * {@link MAL_TOKEN_URL} is the MyAnimeList OAuth2 token endpoint used by `getMalAccessToken` and `refreshMalAccessToken`.
 *
 * It exchanges the PKCE code or refresh token for a `MalTokenResponse`.
 *
 * @see https://myanimelist.net/apiconfig/references/authorization
 */
export const MAL_TOKEN_URL = "https://myanimelist.net/v1/oauth2/token";

/**
 * {@link MAL_API_REFERENCE} is the MyAnimeList API v2 reference index linked from `MyAnimeListApi` and `buildMyAnimeListApi`.
 *
 * Use it as the generic fallback when a more specific endpoint reference is not available.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export const MAL_API_REFERENCE = "https://myanimelist.net/apiconfig/references/api/v2";

/**
 * {@link DEFAULT_MAL_ANIME_FIELDS} is the default field selection sent by `MalAnimeOperation.get` and `MyAnimeListAnimeApi.get` when {@link MalRequestOptions.fields} is omitted.
 *
 * It mirrors the fields declared on {@link MalAnime}, so `GET /anime/{id}` works out of the box without an explicit `fields` query parameter.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 */
export const DEFAULT_MAL_ANIME_FIELDS: readonly string[] = [
    "id",
    "title",
    "main_picture",
    "synopsis",
    "status",
    "mean",
    "num_episodes",
    "media_type",
    "start_date",
    "broadcast",
    "average_episode_duration",
];
