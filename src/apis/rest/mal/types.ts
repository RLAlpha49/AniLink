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
    /** The synopsis, when requested via the `fields` query parameter. */
    synopsis?: string;
    /** The publication/airing status, when requested (one of MAL's status values such as `finished_airing`). */
    status?: string;
    /** The average score out of 10, when requested via the `fields` query parameter. */
    mean?: number;
    /** The total number of episodes, when requested via the `fields` query parameter. */
    num_episodes?: number;
    /** The media type, when requested (for example `tv`, `movie`, or `ova`). */
    media_type?: string;
    /** The first air/start date in ISO 8601 format, when requested via the `fields` query parameter. */
    start_date?: string;
    /** The broadcast schedule, when requested via the `fields` query parameter. */
    broadcast?: string;
    /** The 24-hour broadcast start time (JST) in `HHMM` form, when requested via the `fields` query parameter. */
    start_time?: string;
    /** The average episode duration in seconds, when requested via the `fields` query parameter. */
    average_episode_duration?: number;
    /** Any additional fields requested by a caller remain available without narrowing. */
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
    /** The user's profile picture variants, when requested via the `fields` query parameter. */
    picture?: MalPicture;
    /** The user's gender, when requested via the `fields` query parameter. */
    gender?: string;
    /** The user's birthday in ISO 8601 format, when requested via the `fields` query parameter. */
    birthday?: string;
    /** Any additional fields requested by a caller remain available without narrowing. */
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
