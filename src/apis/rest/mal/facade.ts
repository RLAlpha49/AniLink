import type {
    MalAnime,
    MalAnimeListStatus,
    MalAnimeListStatusUpdate,
    MalManga,
    MalMangaListStatus,
    MalMangaListStatusUpdate,
    MalRequestOptions,
    MalUser,
} from "./types";

/**
 * {@link MyAnimeListAnimeApi} is the anime group exposed by {@link MyAnimeListApi} under `aniLink.mal.anime`.
 *
 * It is the facade boundary for MyAnimeList anime reads and list-status writes; the `MalAnimeOperation.get | get` method delegates to `MalAnimeOperation` and returns a {@link MalAnime} shaped by {@link MalRequestOptions.fields}, while `updateMyListStatus` and `deleteFromList` cover the authenticated `PATCH` and `DELETE /anime/{id}/my_list_status` endpoints.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
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
 * It is the facade boundary for the authenticated MyAnimeList user read; the single `MalUserOperation.me | me` method delegates to `MalUserOperation` and returns a {@link MalUser} shaped by {@link MalRequestOptions.fields}.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
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
}

/**
 * {@link MyAnimeListApi} is the typed MyAnimeList REST surface exposed by `aniLink.mal`.
 *
 * It composes {@link MyAnimeListAnimeApi}, {@link MyAnimeListMangaApi}, and {@link MyAnimeListUserApi} from `MalAnimeOperation`, `MalMangaOperation`, and `MalUserOperation` via `buildMyAnimeListApi`. Read methods accept {@link MalRequestOptions} and return {@link MalAnime}, {@link MalManga}, or {@link MalUser}; the anime and manga groups additionally expose `updateMyListStatus` and `deleteFromList` for the authenticated list-status write/delete endpoints. OAuth helpers `buildMalAuthorizationUrl`, `getMalAccessToken`, and `refreshMalAccessToken` supply the token for `MalCredentials`.
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
