import type { malPaginate, malPaginatePages } from "./Paginator";
import type {
    MalAnime,
    MalAnimeDeleteParams,
    MalAnimeGetParams,
    MalAnimeListStatus,
    MalAnimeListStatusUpdateParams,
    MalAnimeRankingResponse,
    MalAnimeSearchResponse,
    MalAnimeSearchParams,
    MalAnimeSuggestionsResponse,
    MalForumBoardsResponse,
    MalForumTopicParams,
    MalForumTopicResponse,
    MalForumTopicsParams,
    MalForumTopicsResponse,
    MalManga,
    MalMangaDeleteParams,
    MalMangaGetParams,
    MalMangaListStatus,
    MalMangaListStatusUpdateParams,
    MalMangaRankingParams,
    MalMangaRankingResponse,
    MalMangaSearchResponse,
    MalMangaSearchParams,
    MalRankingParams,
    MalRequestOptions,
    MalSeasonalAnimeResponse,
    MalSeasonalParams,
    MalUser,
    MalUserAnimeListParams,
    MalUserAnimeListResponse,
    MalUserGetParams,
    MalUserMangaListParams,
    MalUserMangaListResponse,
} from "./types";

/**
 * {@link MyAnimeListAnimeApi} is the anime group exposed by {@link MyAnimeListApi} under `aniLink.mal.anime`.
 *
 * It is the facade boundary for MyAnimeList anime reads and list-status writes: `get` delegates to `MalAnimeOperation` and returns a {@link MalAnime} shaped by {@link MalRequestOptions.fields}, the discovery reads `seasonal`, `ranking`, and `suggestions` cover the seasonal, ranking, and suggestion endpoints, and `updateMyListStatus` and `deleteFromList` cover the authenticated `PATCH` and `DELETE /anime/{id}/my_list_status` endpoints.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_suggestions_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_put
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_delete
 */
export interface MyAnimeListAnimeApi {
    /**
     * {@link MyAnimeListAnimeApi.get} gets one anime by its MyAnimeList ID through `MalAnimeOperation.get`.
     *
     * It is the public facade for the `GET /anime/{id}` endpoint; use {@link MalRequestOptions.fields} to select the response shape and {@link MalRequestOptions} transport settings to override per call.
     *
     * @param params - The anime lookup inputs; a {@link MalAnimeGetParams} carrying the MyAnimeList anime ID.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The requested {@link MalAnime}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const anime = await api.anime.get({ id: 21 }, { fields: ["id", "title", "main_picture"] });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
     */
    get: (params: MalAnimeGetParams, options?: MalRequestOptions) => Promise<MalAnime>;

    /**
     * {@link MyAnimeListAnimeApi.search} searches MyAnimeList anime by keyword through `MalAnimeOperation.search`.
     *
     * It is the public facade for `GET /anime`; use {@link MalRequestOptions.fields} to select the response shape and {@link MalRequestOptions} transport settings to override per call.
     *
     * @param params - The search inputs; a {@link MalAnimeSearchParams} carrying the keyword plus the optional paging filters.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The search results page, a {@link MalAnimeSearchResponse}.
     * @throws `AniLinkValidationError` when `q` is empty or only whitespace.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const results = await api.anime.search(
     *   { q: "one piece" },
     *   { fields: ["id", "title", "main_picture"] }
     * );
     * console.log(results.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_get
     */
    search: (
        params: MalAnimeSearchParams,
        options?: MalRequestOptions
    ) => Promise<MalAnimeSearchResponse>;

    /**
     * {@link MyAnimeListAnimeApi.seasonal} gets the anime of one broadcast season through `MalAnimeOperation.seasonal`.
     *
     * It is the public facade for `GET /anime/season/{year}/{season}`; use {@link MalRequestOptions.fields} to select the response shape and {@link MalRequestOptions} transport settings to override per call.
     *
     * @param params - The seasonal read inputs; a {@link MalSeasonalParams} carrying the year and broadcast window.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The seasonal anime page, a {@link MalSeasonalAnimeResponse}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const season = await api.anime.seasonal(
     *   { year: 2024, season: "winter" },
     *   { fields: ["id", "title", "main_picture"] }
     * );
     * console.log(season.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get
     */
    seasonal: (
        params: MalSeasonalParams,
        options?: MalRequestOptions
    ) => Promise<MalSeasonalAnimeResponse>;

    /**
     * {@link MyAnimeListAnimeApi.ranking} gets one of MyAnimeList's anime ranking lists through `MalAnimeOperation.ranking`.
     *
     * It is the public facade for `GET /anime/ranking`; use {@link MalRequestOptions.fields} to select the response shape and {@link MalRequestOptions} transport settings to override per call.
     *
     * @param params - The ranking read inputs; a {@link MalRankingParams} carrying the ranking list to fetch.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The ranking page, a {@link MalAnimeRankingResponse}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const top = await api.anime.ranking(
     *   { rankingType: "airing" },
     *   { fields: ["id", "title", "mean"] }
     * );
     * console.log(top.data[0]?.node.title, top.data[0]?.ranking.rank);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get
     */
    ranking: (
        params: MalRankingParams,
        options?: MalRequestOptions
    ) => Promise<MalAnimeRankingResponse>;

    /**
     * {@link MyAnimeListAnimeApi.suggestions} gets MyAnimeList's anime suggestions for the authenticated user through `MalAnimeOperation.suggestions`.
     *
     * It is the public facade for `GET /anime/suggestions` and requires a MAL access token from `MalCredentials.accessToken` via `buildMyAnimeListApi`; use {@link MalRequestOptions.fields} to select the response shape.
     *
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The suggestions page, a {@link MalAnimeSuggestionsResponse}.
     * @throws `AniLinkAuthError` when no MAL access token is configured.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const suggestions = await api.anime.suggestions({
     *   fields: ["id", "title", "main_picture"],
     * });
     * console.log(suggestions.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_suggestions_get
     */
    suggestions: (options?: MalRequestOptions) => Promise<MalAnimeSuggestionsResponse>;

    /**
     * {@link MyAnimeListAnimeApi.updateMyListStatus} updates the authenticated user's anime list status through `MalAnimeOperation.updateMyListStatus`.
     *
     * It is the public facade for `PATCH /anime/{id}/my_list_status` and requires a MAL access token from `MalCredentials.accessToken` via `buildMyAnimeListApi`; send only the `MalAnimeListStatusUpdate` fields you want to change, form-encoded as MAL requires.
     *
     * @param params - The list-status write inputs; a {@link MalAnimeListStatusUpdateParams} carrying the anime ID plus only the fields to change.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The updated {@link MalAnimeListStatus}.
     * @throws `AniLinkAuthError` when no MAL access token is configured.
     * @throws `AniLinkValidationError` when params carries no known list-status field to change.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const status = await api.anime.updateMyListStatus({
     *   id: 21,
     *   status: "watching",
     *   num_watched_episodes: 10,
     *   score: 9,
     * });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_put
     */
    updateMyListStatus: (
        params: MalAnimeListStatusUpdateParams,
        options?: MalRequestOptions
    ) => Promise<MalAnimeListStatus>;

    /**
     * {@link MyAnimeListAnimeApi.deleteFromList} removes an anime from the authenticated user's list through `MalAnimeOperation.deleteFromList`.
     *
     * It is the public facade for `DELETE /anime/{id}/my_list_status` and requires a MAL access token from `MalCredentials.accessToken` via `buildMyAnimeListApi`.
     *
     * @param params - The delete inputs; a {@link MalAnimeDeleteParams} carrying the MyAnimeList anime ID.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns Resolves once the entry is deleted; the response carries no body.
     * @throws `AniLinkAuthError` when no MAL access token is configured.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * await api.anime.deleteFromList({ id: 21 });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_delete
     */
    deleteFromList: (params: MalAnimeDeleteParams, options?: MalRequestOptions) => Promise<void>;
}

/**
 * {@link MyAnimeListMangaApi} is the manga group exposed by {@link MyAnimeListApi} under `aniLink.mal.manga`.
 *
 * It is the facade boundary for MyAnimeList manga reads and list-status writes: `get` delegates to `MalMangaOperation` and returns a {@link MalManga} shaped by {@link MalRequestOptions.fields}, while `updateMyListStatus` and `deleteFromList` cover the authenticated `PATCH` and `DELETE /manga/{id}/my_list_status` endpoints.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_delete
 */
export interface MyAnimeListMangaApi {
    /**
     * {@link MyAnimeListMangaApi.get} gets one manga by its MyAnimeList ID through `MalMangaOperation.get`.
     *
     * It is the public facade for the `GET /manga/{id}` endpoint; use {@link MalRequestOptions.fields} to select the response shape and {@link MalRequestOptions} transport settings to override per call.
     *
     * @param params - The manga lookup inputs; a {@link MalMangaGetParams} carrying the MyAnimeList manga ID.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The requested {@link MalManga}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const manga = await api.manga.get({ id: 1 }, { fields: ["id", "title", "main_picture"] });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
     */
    get: (params: MalMangaGetParams, options?: MalRequestOptions) => Promise<MalManga>;

    /**
     * {@link MyAnimeListMangaApi.search} searches MyAnimeList manga by keyword through `MalMangaOperation.search`.
     *
     * It is the public facade for `GET /manga`; use {@link MalRequestOptions.fields} to select the response shape and {@link MalRequestOptions} transport settings to override per call.
     *
     * @param params - The search inputs; a {@link MalMangaSearchParams} carrying the keyword plus the optional paging filters.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The search results page, a {@link MalMangaSearchResponse}.
     * @throws `AniLinkValidationError` when `q` is empty or only whitespace.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const results = await api.manga.search(
     *   { q: "berserk" },
     *   { fields: ["id", "title", "main_picture"] }
     * );
     * console.log(results.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_get
     */
    search: (
        params: MalMangaSearchParams,
        options?: MalRequestOptions
    ) => Promise<MalMangaSearchResponse>;

    /**
     * {@link MyAnimeListMangaApi.ranking} gets one of MyAnimeList's manga ranking lists through `MalMangaOperation.ranking`.
     *
     * It is the public facade for `GET /manga/ranking`; use {@link MalRequestOptions.fields} to select the response shape and {@link MalRequestOptions} transport settings to override per call.
     *
     * @param params - The ranking read inputs; a {@link MalMangaRankingParams} carrying the ranking list to fetch.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The ranking page, a {@link MalMangaRankingResponse}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const top = await api.manga.ranking(
     *   { rankingType: "manga" },
     *   { fields: ["id", "title", "mean"] }
     * );
     * console.log(top.data[0]?.node.title, top.data[0]?.ranking.rank);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_ranking_get
     */
    ranking: (
        params: MalMangaRankingParams,
        options?: MalRequestOptions
    ) => Promise<MalMangaRankingResponse>;

    /**
     * {@link MyAnimeListMangaApi.updateMyListStatus} updates the authenticated user's manga list status through `MalMangaOperation.updateMyListStatus`.
     *
     * It is the public facade for `PATCH /manga/{id}/my_list_status` and requires a MAL access token from `MalCredentials.accessToken` via `buildMyAnimeListApi`; send only the `MalMangaListStatusUpdate` fields you want to change, form-encoded as MAL requires.
     *
     * @param params - The list-status write inputs; a {@link MalMangaListStatusUpdateParams} carrying the manga ID plus only the fields to change.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The updated {@link MalMangaListStatus}.
     * @throws `AniLinkAuthError` when no MAL access token is configured.
     * @throws `AniLinkValidationError` when params carries no known list-status field to change.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const status = await api.manga.updateMyListStatus({
     *   id: 1,
     *   status: "reading",
     *   num_chapters_read: 10,
     *   score: 9,
     * });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put
     */
    updateMyListStatus: (
        params: MalMangaListStatusUpdateParams,
        options?: MalRequestOptions
    ) => Promise<MalMangaListStatus>;

    /**
     * {@link MyAnimeListMangaApi.deleteFromList} removes a manga from the authenticated user's list through `MalMangaOperation.deleteFromList`.
     *
     * It is the public facade for `DELETE /manga/{id}/my_list_status` and requires a MAL access token from `MalCredentials.accessToken` via `buildMyAnimeListApi`.
     *
     * @param params - The delete inputs; a {@link MalMangaDeleteParams} carrying the MyAnimeList manga ID.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns Resolves once the entry is deleted; the response carries no body.
     * @throws `AniLinkAuthError` when no MAL access token is configured.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * await api.manga.deleteFromList({ id: 1 });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_delete
     */
    deleteFromList: (params: MalMangaDeleteParams, options?: MalRequestOptions) => Promise<void>;
}

/**
 * {@link MyAnimeListUserApi} is the user group exposed by {@link MyAnimeListApi} under `aniLink.mal.user`.
 *
 * It is the facade boundary for the MyAnimeList user reads: `me` delegates to `MalUserOperation` and returns a {@link MalUser} shaped by {@link MalRequestOptions.fields}, while the paginated user-list reads `animeList` and `mangaList` cover `GET /users/{user_name}/animelist` and `GET /users/{user_name}/mangalist`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
 */
export interface MyAnimeListUserApi {
    /**
     * {@link MyAnimeListUserApi.me} gets the currently authenticated MyAnimeList user through `MalUserOperation.me`.
     *
     * It is the public facade for `GET /users/@me` and requires a MAL access token from `MalCredentials.accessToken` via `buildMyAnimeListApi`; use {@link MalRequestOptions.fields} to select the response shape.
     *
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The authenticated {@link MalUser}.
     * @throws `AniLinkAuthError` when no MAL access token is configured.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const user = await api.user.me({ fields: ["id", "name"] });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
     */
    me: (options?: MalRequestOptions) => Promise<MalUser>;

    /**
     * {@link MyAnimeListUserApi.get} gets a MyAnimeList user profile through `MalUserOperation.get`.
     *
     * It is the public facade for `GET /users/{user_name}`; MyAnimeList documents only `@me` for this endpoint, so `username` accepts `@me` (case-insensitive, whitespace-tolerant) and requires an access token to resolve it. Other usernames are passed through, but MyAnimeList currently answers them with `404`. Use {@link MalRequestOptions.fields} to select the response shape.
     *
     * @param params - The profile read inputs; a {@link MalUserGetParams} carrying the username.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The requested {@link MalUser}.
     * @throws `AniLinkAuthError` when `username` is `@me` and no access token is configured.
     * @throws `AniLinkValidationError` when `username` is empty or only whitespace.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const user = await api.user.get(
     *   { username: "@me" },
     *   { fields: ["id", "name", "location"] }
     * );
     * console.log(user.name);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
     */
    get: (params: MalUserGetParams, options?: MalRequestOptions) => Promise<MalUser>;

    /**
     * {@link MyAnimeListUserApi.animeList} gets a user's anime list through `MalUserOperation.animeList`.
     *
     * It is the public facade for `GET /users/{user_name}/animelist`; `username` accepts a user name or `@me`. A public list needs only `MalCredentials.clientId` (or an access token) — MAL rejects unauthenticated requests — while `@me` and private lists need an access token (a client ID alone cannot resolve `@me`). The `@me` check is case-insensitive and ignores surrounding whitespace. Use {@link MalUserAnimeListParams} to filter by status, sort, and page with `limit`/`offset`.
     *
     * @param params - The anime-list read inputs; a {@link MalUserAnimeListParams} carrying the username plus the optional status, sort, and paging filters.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The anime list page, a {@link MalUserAnimeListResponse}.
     * @throws `AniLinkAuthError` when `username` is `@me` and no access token is configured.
     * @throws `AniLinkValidationError` when `username` is empty or only whitespace.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const list = await api.user.animeList(
     *   { username: "@me", status: "watching" },
     *   { fields: ["id", "title", "list_status"] }
     * );
     * console.log(list.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
     */
    animeList: (
        params: MalUserAnimeListParams,
        options?: MalRequestOptions
    ) => Promise<MalUserAnimeListResponse>;

    /**
     * {@link MyAnimeListUserApi.mangaList} gets a user's manga list through `MalUserOperation.mangaList`.
     *
     * It is the public facade for `GET /users/{user_name}/mangalist`; `username` accepts a user name or `@me`. A public list needs only `MalCredentials.clientId` (or an access token) — MAL rejects unauthenticated requests — while `@me` and private lists need an access token (a client ID alone cannot resolve `@me`). The `@me` check is case-insensitive and ignores surrounding whitespace. Use {@link MalUserMangaListParams} to filter by status, sort, and page with `limit`/`offset`.
     *
     * @param params - The manga-list read inputs; a {@link MalUserMangaListParams} carrying the username plus the optional status, sort, and paging filters.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The manga list page, a {@link MalUserMangaListResponse}.
     * @throws `AniLinkAuthError` when `username` is `@me` and no access token is configured.
     * @throws `AniLinkValidationError` when `username` is empty or only whitespace.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const list = await api.user.mangaList(
     *   { username: "@me", status: "reading" },
     *   { fields: ["id", "title", "list_status"] }
     * );
     * console.log(list.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
     */
    mangaList: (
        params: MalUserMangaListParams,
        options?: MalRequestOptions
    ) => Promise<MalUserMangaListResponse>;
}

/**
 * {@link MyAnimeListForumApi} is the forum group exposed by {@link MyAnimeListApi} under `aniLink.mal.forum`.
 *
 * It is the facade boundary for the MyAnimeList forum reads: `boards` delegates to `MalForumOperation` and returns the {@link MalForumBoardsResponse} board tree, `topics` covers the filterable `GET /forum/topics` topic list, and `topic` covers `GET /forum/topic/{topic_id}` with its posts and poll.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_boards_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topics_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
 */
export interface MyAnimeListForumApi {
    /**
     * {@link MyAnimeListForumApi.boards} gets the MyAnimeList forum board tree through `MalForumOperation.boards`.
     *
     * It is the public facade for `GET /forum/boards`; use {@link MalRequestOptions} transport settings to override per call.
     *
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The forum board tree, a {@link MalForumBoardsResponse}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const boards = await api.forum.boards();
     * console.log(boards.categories[0]?.boards[0]?.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_boards_get
     */
    boards: (options?: MalRequestOptions) => Promise<MalForumBoardsResponse>;

    /**
     * {@link MyAnimeListForumApi.topics} gets the MyAnimeList forum topic list through `MalForumOperation.topics`.
     *
     * It is the public facade for `GET /forum/topics`; filter by board, keyword, or creator with {@link MalForumTopicsParams} and page with `limit`/`offset`.
     *
     * @param params - The topic-list read inputs; a {@link MalForumTopicsParams} carrying the optional board, keyword, creator, sort, and paging filters.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The topic list page, a {@link MalForumTopicsResponse}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const topics = await api.forum.topics({ q: "one piece" });
     * console.log(topics.data[0]?.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topics_get
     */
    topics: (
        params?: MalForumTopicsParams,
        options?: MalRequestOptions
    ) => Promise<MalForumTopicsResponse>;

    /**
     * {@link MyAnimeListForumApi.topic} gets one forum topic with its posts and poll through `MalForumOperation.topic`.
     *
     * It is the public facade for `GET /forum/topic/{topic_id}`; page through a long topic's posts with the `limit`/`offset` fields of {@link MalForumTopicParams}.
     *
     * @param params - The topic read inputs; a {@link MalForumTopicParams} carrying the topic ID plus the optional post-paging filters.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The topic detail page, a {@link MalForumTopicResponse}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const topic = await api.forum.topic({ id: 23744 });
     * console.log(topic.data.title, topic.data.posts[0]?.body);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
     */
    topic: (
        params: MalForumTopicParams,
        options?: MalRequestOptions
    ) => Promise<MalForumTopicResponse>;
}

/**
 * {@link MyAnimeListApi} is the typed MyAnimeList REST surface exposed by `aniLink.mal`.
 *
 * It composes {@link MyAnimeListAnimeApi}, {@link MyAnimeListMangaApi}, and {@link MyAnimeListUserApi} from `MalAnimeOperation`, `MalMangaOperation`, and `MalUserOperation` via `buildMyAnimeListApi`. Each group's member set is checked bidirectionally against the operation registry in `registry.ts` at compile time, so this file and the registry cannot drift without failing `tsc`. Read methods accept {@link MalRequestOptions} and return {@link MalAnime}, {@link MalManga}, or {@link MalUser}; the anime group additionally exposes the discovery reads `seasonal`, `ranking`, and `suggestions` for the seasonal, ranking, and suggestion endpoints, and the anime and manga groups expose `updateMyListStatus` and `deleteFromList` for the authenticated list-status write/delete endpoints. OAuth helpers `buildMalAuthorizationUrl`, `getMalAccessToken`, and `refreshMalAccessToken` supply the token for `MalCredentials`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export interface MyAnimeListApi {
    /** Anime operations via {@link MyAnimeListAnimeApi} and `MalAnimeOperation`. */
    anime: MyAnimeListAnimeApi;
    /** Manga operations via {@link MyAnimeListMangaApi} and `MalMangaOperation`. */
    manga: MyAnimeListMangaApi;
    /** User operations via {@link MyAnimeListUserApi} and `MalUserOperation`. */
    user: MyAnimeListUserApi;
    /** Forum operations via {@link MyAnimeListForumApi} and `MalForumOperation`. */
    forum: MyAnimeListForumApi;
    /**
     * {@link malPaginate} walks MyAnimeList list pages until a short page or the
     * `maxPages` guard is reached, collecting every item across pages.
     * @param fetchPage - Callback that fetches a single page given its 1-based number, `perPage`, and the traversal's `AbortSignal`; return the raw MAL list response (`{ data, paging? }`).
     * @param options - Optional `perPage`, `startPage`, `maxPages`, `concurrency`, `signal`, and `onPage` controls; a `MalPaginateOptions`.
     * @returns The collected items, per-page snapshots, page count, and whether the guard truncated the run; a `MalPaginateResult`.
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_get
     * @example
     * ```typescript
     * const result = await aniLink.mal.paginate(
     *   (page, perPage) => aniLink.mal.anime.search({
     *     q: "one piece",
     *     limit: perPage,
     *     offset: (page - 1) * perPage,
     *   }),
     *   { perPage: 100, maxPages: 5 }
     * );
     * console.log(result.items.length, result.truncated);
     * ```
     */
    paginate: typeof malPaginate;
    /**
     * `malPaginatePages` is an async generator yielding each MyAnimeList list
     * page until a short page or the `maxPages` guard is reached. The
     * `onPage` callback (when configured) fires once per page as it is
     * yielded, mirroring `mal.paginate`'s observer contract in streaming form.
     * @param fetchPage - Callback that fetches a single page given its 1-based number, `perPage`, and the traversal's `AbortSignal`; return the raw MAL list response (`{ data, paging? }`).
     * @param options - Optional `perPage`, `startPage`, `maxPages`, `concurrency`, `signal`, `onPage`, `onHookError`, and `diagnostics` controls; a `MalPaginateOptions`.
     * @returns An async generator yielding each raw MAL list page in turn.
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_get
     * @example
     * ```typescript
     * for await (const page of aniLink.mal.paginatePages((page, perPage) =>
     *   aniLink.mal.user.animeList({
     *     username: "@me",
     *     limit: perPage,
     *     offset: (page - 1) * perPage,
     *   })
     * )) {
     *   console.log(page.data.length);
     * }
     * ```
     */
    paginatePages: typeof malPaginatePages;
}
