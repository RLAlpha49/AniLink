import type {
    MalAnime,
    MalAnimeListStatus,
    MalAnimeListStatusUpdate,
    MalAnimeRankingResponse,
    MalAnimeSuggestionsResponse,
    MalManga,
    MalMangaListStatus,
    MalMangaListStatusUpdate,
    MalRankingType,
    MalRequestOptions,
    MalSeason,
    MalSeasonalAnimeResponse,
    MalUser,
    MalUserAnimeListOptions,
    MalUserAnimeListResponse,
    MalUserMangaListOptions,
    MalUserMangaListResponse,
} from "./types";

/**
 * {@link MyAnimeListAnimeApi} is the anime group exposed by {@link MyAnimeListApi} under `aniLink.mal.anime`.
 *
 * It is the facade boundary for MyAnimeList anime reads and list-status writes; the {@link MalAnimeOperation.get | get} method delegates to `MalAnimeOperation` and returns a {@link MalAnime} shaped by {@link MalRequestOptions.fields}, the discovery reads `seasonal`, `ranking`, and `suggestions` cover the seasonal, ranking, and suggestion endpoints, while `updateMyListStatus` and `deleteFromList` cover the authenticated `PATCH` and `DELETE /anime/{id}/my_list_status` endpoints.
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
     * @param id - The MyAnimeList anime ID.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The requested {@link MalAnime}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const anime = await api.anime.get(21, { fields: ["id", "title", "main_picture"] });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
     */
    get: (id: number, options?: MalRequestOptions) => Promise<MalAnime>;

    /**
     * {@link MyAnimeListAnimeApi.seasonal} gets the anime of one broadcast season through `MalAnimeOperation.seasonal`.
     *
     * It is the public facade for `GET /anime/season/{year}/{season}`; use {@link MalRequestOptions.fields} to select the response shape and {@link MalRequestOptions} transport settings to override per call.
     *
     * @param year - The season's year.
     * @param season - The season's broadcast window; one of {@link MalSeason}.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The seasonal anime page, a {@link MalSeasonalAnimeResponse}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const season = await api.anime.seasonal(2024, "winter", {
     *   fields: ["id", "title", "main_picture"],
     * });
     * console.log(season.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get
     */
    seasonal: (
        year: number,
        season: MalSeason,
        options?: MalRequestOptions
    ) => Promise<MalSeasonalAnimeResponse>;

    /**
     * {@link MyAnimeListAnimeApi.ranking} gets one of MyAnimeList's anime ranking lists through `MalAnimeOperation.ranking`.
     *
     * It is the public facade for `GET /anime/ranking`; use {@link MalRequestOptions.fields} to select the response shape and {@link MalRequestOptions} transport settings to override per call.
     *
     * @param rankingType - The ranking list to fetch; one of {@link MalRankingType}.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The ranking page, a {@link MalAnimeRankingResponse}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const top = await api.anime.ranking("airing", {
     *   fields: ["id", "title", "mean"],
     * });
     * console.log(top.data[0]?.node.title, top.data[0]?.ranking.rank);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get
     */
    ranking: (
        rankingType: MalRankingType,
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
     * It is the public facade for `PATCH /anime/{id}/my_list_status` and requires a MAL access token from `MalCredentials.accessToken` via `buildMyAnimeListApi`; send only the {@link MalAnimeListStatusUpdate} fields you want to change, form-encoded as MAL requires.
     *
     * @param id - The MyAnimeList anime ID.
     * @param payload - The list-status fields to update; a {@link MalAnimeListStatusUpdate} of only the fields to change.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The updated {@link MalAnimeListStatus}.
     * @throws `AniLinkAuthError` when no MAL access token is configured.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const status = await api.anime.updateMyListStatus(21, {
     *   status: "watching",
     *   num_watched_episodes: 10,
     *   score: 9,
     * });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_put
     */
    updateMyListStatus: (
        id: number,
        payload: MalAnimeListStatusUpdate,
        options?: MalRequestOptions
    ) => Promise<MalAnimeListStatus>;

    /**
     * {@link MyAnimeListAnimeApi.deleteFromList} removes an anime from the authenticated user's list through `MalAnimeOperation.deleteFromList`.
     *
     * It is the public facade for `DELETE /anime/{id}/my_list_status` and requires a MAL access token from `MalCredentials.accessToken` via `buildMyAnimeListApi`.
     *
     * @param id - The MyAnimeList anime ID.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns Resolves once the entry is deleted; the response carries no body.
     * @throws `AniLinkAuthError` when no MAL access token is configured.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * await api.anime.deleteFromList(21);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_delete
     */
    deleteFromList: (id: number, options?: MalRequestOptions) => Promise<void>;
}

/**
 * {@link MyAnimeListMangaApi} is the manga group exposed by {@link MyAnimeListApi} under `aniLink.mal.manga`.
 *
 * It is the facade boundary for MyAnimeList manga reads and list-status writes; the {@link MalMangaOperation.get | get} method delegates to `MalMangaOperation` and returns a {@link MalManga} shaped by {@link MalRequestOptions.fields}, while `updateMyListStatus` and `deleteFromList` cover the authenticated `PATCH` and `DELETE /manga/{id}/my_list_status` endpoints.
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
     * @param id - The MyAnimeList manga ID.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The requested {@link MalManga}.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const manga = await api.manga.get(1, { fields: ["id", "title", "main_picture"] });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
     */
    get: (id: number, options?: MalRequestOptions) => Promise<MalManga>;

    /**
     * {@link MyAnimeListMangaApi.updateMyListStatus} updates the authenticated user's manga list status through `MalMangaOperation.updateMyListStatus`.
     *
     * It is the public facade for `PATCH /manga/{id}/my_list_status` and requires a MAL access token from `MalCredentials.accessToken` via `buildMyAnimeListApi`; send only the {@link MalMangaListStatusUpdate} fields you want to change, form-encoded as MAL requires.
     *
     * @param id - The MyAnimeList manga ID.
     * @param payload - The list-status fields to update; a {@link MalMangaListStatusUpdate} of only the fields to change.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The updated {@link MalMangaListStatus}.
     * @throws `AniLinkAuthError` when no MAL access token is configured.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const status = await api.manga.updateMyListStatus(1, {
     *   status: "reading",
     *   num_chapters_read: 10,
     *   score: 9,
     * });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put
     */
    updateMyListStatus: (
        id: number,
        payload: MalMangaListStatusUpdate,
        options?: MalRequestOptions
    ) => Promise<MalMangaListStatus>;

    /**
     * {@link MyAnimeListMangaApi.deleteFromList} removes a manga from the authenticated user's list through `MalMangaOperation.deleteFromList`.
     *
     * It is the public facade for `DELETE /manga/{id}/my_list_status` and requires a MAL access token from `MalCredentials.accessToken` via `buildMyAnimeListApi`.
     *
     * @param id - The MyAnimeList manga ID.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns Resolves once the entry is deleted; the response carries no body.
     * @throws `AniLinkAuthError` when no MAL access token is configured.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * await api.manga.deleteFromList(1);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_delete
     */
    deleteFromList: (id: number, options?: MalRequestOptions) => Promise<void>;
}

/**
 * {@link MyAnimeListUserApi} is the user group exposed by {@link MyAnimeListApi} under `aniLink.mal.user`.
 *
 * It is the facade boundary for the MyAnimeList user reads; the `MalUserOperation.me | me` method delegates to `MalUserOperation` and returns a {@link MalUser} shaped by {@link MalRequestOptions.fields}, while the paginated user-list reads `animeList` and `mangaList` cover `GET /users/{user_name}/animelist` and `GET /users/{user_name}/mangalist`.
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
     * {@link MyAnimeListUserApi.animeList} gets a user's anime list through `MalUserOperation.animeList`.
     *
     * It is the public facade for `GET /users/{user_name}/animelist`; `username` accepts a user name or `@me`, and public lists need no credentials while `@me` and private lists need an access token (a client ID alone cannot resolve `@me`). The `@me` check is case-insensitive and ignores surrounding whitespace. Use {@link MalUserAnimeListOptions} to filter by status, sort, page with `limit`/`offset`, and select the response shape.
     *
     * @param username - The MyAnimeList user name, or `@me` for the authenticated user (case-insensitive, surrounding whitespace ignored).
     * @param options - Optional status, sort, paging, field selection, and transport settings; a {@link MalUserAnimeListOptions} merged over the instance defaults.
     * @returns The anime list page, a {@link MalUserAnimeListResponse}.
     * @throws `AniLinkAuthError` when `username` is `@me` and no access token is configured.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const list = await api.user.animeList("@me", {
     *   status: "watching",
     *   fields: ["id", "title", "list_status"],
     * });
     * console.log(list.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
     */
    animeList: (
        username: string,
        options?: MalUserAnimeListOptions
    ) => Promise<MalUserAnimeListResponse>;

    /**
     * {@link MyAnimeListUserApi.mangaList} gets a user's manga list through `MalUserOperation.mangaList`.
     *
     * It is the public facade for `GET /users/{user_name}/mangalist`; `username` accepts a user name or `@me`, and public lists need no credentials while `@me` and private lists need an access token (a client ID alone cannot resolve `@me`). The `@me` check is case-insensitive and ignores surrounding whitespace. Use {@link MalUserMangaListOptions} to filter by status, sort, page with `limit`/`offset`, and select the response shape.
     *
     * @param username - The MyAnimeList user name, or `@me` for the authenticated user (case-insensitive, surrounding whitespace ignored).
     * @param options - Optional status, sort, paging, field selection, and transport settings; a {@link MalUserMangaListOptions} merged over the instance defaults.
     * @returns The manga list page, a {@link MalUserMangaListResponse}.
     * @throws `AniLinkAuthError` when `username` is `@me` and no access token is configured.
     * @throws `AniLinkRestError` for a non-success MyAnimeList response.
     * @throws `AniLinkNetworkError` for timeout, cancellation, or other transport failures.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const list = await api.user.mangaList("@me", {
     *   status: "reading",
     *   fields: ["id", "title", "list_status"],
     * });
     * console.log(list.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
     */
    mangaList: (
        username: string,
        options?: MalUserMangaListOptions
    ) => Promise<MalUserMangaListResponse>;
}

/**
 * {@link MyAnimeListApi} is the typed MyAnimeList REST surface exposed by `aniLink.mal`.
 *
 * It composes {@link MyAnimeListAnimeApi}, {@link MyAnimeListMangaApi}, and {@link MyAnimeListUserApi} from `MalAnimeOperation`, `MalMangaOperation`, and `MalUserOperation` via `buildMyAnimeListApi`. Read methods accept {@link MalRequestOptions} and return {@link MalAnime}, {@link MalManga}, or {@link MalUser}; the anime group additionally exposes the discovery reads `seasonal`, `ranking`, and `suggestions` for the seasonal, ranking, and suggestion endpoints, and the anime and manga groups expose `updateMyListStatus` and `deleteFromList` for the authenticated list-status write/delete endpoints. OAuth helpers `buildMalAuthorizationUrl`, `getMalAccessToken`, and `refreshMalAccessToken` supply the token for `MalCredentials`.
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
}
