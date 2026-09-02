import type { MalAnime, MalRequestOptions, MalUser } from "./types";

/**
 * {@link MyAnimeListAnimeApi} is the anime group exposed by {@link MyAnimeListApi} under `aniLink.mal.anime`.
 *
 * It is the facade boundary for MyAnimeList anime reads; the single `MalAnimeOperation.get | get` method delegates to `MalAnimeOperation` and returns a {@link MalAnime} shaped by {@link MalRequestOptions.fields}.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
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
 * It composes {@link MyAnimeListAnimeApi} and {@link MyAnimeListUserApi} from `MalAnimeOperation` and `MalUserOperation` via `buildMyAnimeListApi`. Every method accepts {@link MalRequestOptions} and returns {@link MalAnime} or {@link MalUser}; OAuth helpers `buildMalAuthorizationUrl`, `getMalAccessToken`, and `refreshMalAccessToken` supply the token for `MalCredentials`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export interface MyAnimeListApi {
    /** Anime operations via {@link MyAnimeListAnimeApi} and `MalAnimeOperation`. */
    anime: MyAnimeListAnimeApi;
    /** User operations via {@link MyAnimeListUserApi} and `MalUserOperation`. */
    user: MyAnimeListUserApi;
}
