import type { RequestOptions } from "../../../base/RequestHandler";

/**
 * {@link MalPicture} is the image variants returned by MyAnimeList for an anime entity.
 *
 * It is the `main_picture` shape inside {@link MalAnime} and is selected via {@link MalRequestOptions.fields} through `MalAnimeOperation.get` and `MyAnimeListAnimeApi.get`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 */
export interface MalPicture {
    /** The large image URL, when MyAnimeList provides one. */
    large?: string;
    /** The medium image URL, when MyAnimeList provides one. */
    medium?: string;
}

/**
 * {@link MalAnime} is the typed portion of a MyAnimeList anime response returned by `MalAnimeOperation.get` and `MyAnimeListAnimeApi.get`.
 *
 * It always carries `id` and `title`; additional fields appear when requested via {@link MalRequestOptions.fields} and are exposed through the index signature without narrowing.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 */
export interface MalAnime {
    /** The MyAnimeList numeric identifier. */
    id: number;
    /** The canonical MyAnimeList title. */
    title: string;
    /** Optional image variants requested through the `fields` query parameter. */
    main_picture?: MalPicture;
    /** Additional fields requested by a caller remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalUser} is the typed portion of the authenticated MyAnimeList user response returned by `MalUserOperation.me` and `MyAnimeListUserApi.me`.
 *
 * It always carries `id` and `name`; additional fields appear when requested via {@link MalRequestOptions.fields} and are exposed through the index signature without narrowing.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
 */
export interface MalUser {
    /** The MyAnimeList numeric user identifier. */
    id: number;
    /** The user's MyAnimeList name. */
    name: string;
    /** Optional profile location. */
    location?: string;
    /** Optional account creation timestamp. */
    joined_at?: string;
    /** Additional fields requested by a caller remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalRequestOptions} is the public request options shared by MAL endpoint methods.
 *
 * It extends {@link RequestOptions} with the MyAnimeList `fields` selector consumed by `MalAnimeOperation.get` and `MalUserOperation.me` through `MyAnimeListApi`. Transport settings are merged over the instance defaults from `MalCredentials` via `buildMyAnimeListApi`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
 */
export interface MalRequestOptions extends RequestOptions {
    /** A comma-separated field selector, or the same selector as an array. */
    fields?: string | readonly string[];
}
