import type { RequestOptions } from "../../../base/RequestHandler";

/**
 * {@link MalPicture} is the image variants returned by MyAnimeList for an anime or manga entity.
 *
 * It is the `main_picture` shape inside {@link MalAnime} and {@link MalManga} and is selected via {@link MalRequestOptions.fields} through `MalAnimeOperation.get`, `MalMangaOperation.get`, `MyAnimeListAnimeApi.get`, and `MyAnimeListMangaApi.get`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
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
 * {@link MalManga} is the typed portion of a MyAnimeList manga response returned by `MalMangaOperation.get` and `MyAnimeListMangaApi.get`.
 *
 * It always carries `id` and `title`; additional fields appear when requested via {@link MalRequestOptions.fields} and are exposed through the index signature without narrowing. Manga-specific fields such as `num_chapters` and `num_volumes` mirror the MyAnimeList manga endpoint shape.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
 */
export interface MalManga {
    /** The MyAnimeList numeric identifier. */
    id: number;
    /** The canonical MyAnimeList title. */
    title: string;
    /** Optional image variants requested through the `fields` query parameter. */
    main_picture?: MalPicture;
    /** The synopsis, when requested via the `fields` query parameter. */
    synopsis?: string;
    /** The publication status, when requested (one of MAL's status values such as `finished`). */
    status?: string;
    /** The average score out of 10, when requested via the `fields` query parameter. */
    mean?: number;
    /** The total number of chapters, when requested via the `fields` query parameter. */
    num_chapters?: number;
    /** The total number of volumes, when requested via the `fields` query parameter. */
    num_volumes?: number;
    /** The media type, when requested (for example `manga`, `novel`, or `oneshot`). */
    media_type?: string;
    /** The first publication date in ISO 8601 format, when requested via the `fields` query parameter. */
    start_date?: string;
    /** The end publication date in ISO 8601 format, when requested via the `fields` query parameter. */
    end_date?: string;
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
 * It extends {@link RequestOptions} with the MyAnimeList `fields` selector consumed by `MalAnimeOperation.get`, `MalMangaOperation.get`, and `MalUserOperation.me` through `MyAnimeListApi`. Transport settings are merged over the instance defaults from `MalCredentials` via `buildMyAnimeListApi`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
 */
export interface MalRequestOptions extends RequestOptions {
    /** A comma-separated field selector, or the same selector as an array. */
    fields?: string | readonly string[];
}

/**
 * The watch status of an anime on a user's MyAnimeList list.
 *
 * These are the five fixed values MyAnimeList accepts for the `status` field
 * of {@link MalAnimeListStatusUpdate} and returns on {@link MalAnimeListStatus}.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_put
 */
export type MalAnimeListStatusValue =
    "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch";

/**
 * {@link MalAnimeListStatusUpdate} is the form-urlencoded PATCH request body for updating a user's anime list status.
 *
 * Every field is optional: callers send only the fields they want to change. It is consumed by `MalAnimeOperation.updateMyListStatus` and `MyAnimeListAnimeApi.updateMyListStatus` against `PATCH /anime/{anime_id}/my_list_status`, which encodes it as `application/x-www-form-urlencoded` (MAL rejects JSON on this endpoint).
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_put
 */
export interface MalAnimeListStatusUpdate {
    /** The watch status to set; one of {@link MalAnimeListStatusValue}. */
    status?: MalAnimeListStatusValue;
    /** The number of episodes the user has watched. */
    num_watched_episodes?: number;
    /** The user's score out of 10. */
    score?: number;
    /** The date the user started watching, in ISO 8601 form; MAL also accepts partial dates (`YYYY-MM` or `YYYY`). */
    start_date?: string;
    /** The date the user finished watching, in ISO 8601 form; MAL also accepts partial dates (`YYYY-MM` or `YYYY`). */
    finish_date?: string;
    /** Free-form notes the user attached to the entry. */
    comments?: string;
    /** Whether the user is currently rewatching the anime. */
    is_rewatching?: boolean;
    /** The number of times the user has rewatched the anime. */
    num_times_rewatched?: number;
    /** The rewatch value rating (0-5). */
    rewatch_value?: number;
    /** The priority rating (0-2). */
    priority?: number;
    /** User-defined tags attached to the entry; sent as a comma-separated string. */
    tags?: readonly string[];
}

/**
 * {@link MalAnimeListStatus} is the response returned by MyAnimeList for a user's anime list status.
 *
 * It is the shape returned by `MalAnimeOperation.updateMyListStatus` and `MyAnimeListAnimeApi.updateMyListStatus` from `PATCH /anime/{anime_id}/my_list_status`. MyAnimeList returns `tags` as a single comma-separated string and reports the episode count as `num_episodes_watched` (the request field is `num_watched_episodes` — a documented MAL asymmetry); the server-managed `updated_at` timestamp is included when set.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_put
 */
export interface MalAnimeListStatus {
    /** The current watch status; one of {@link MalAnimeListStatusValue}. */
    status: MalAnimeListStatusValue;
    /** The number of episodes the user has watched; MAL reports this as `num_episodes_watched`. */
    num_episodes_watched: number;
    /** The user's score out of 10. */
    score: number;
    /** The date the user started watching, in ISO 8601 form; may be a partial date (`YYYY-MM` or `YYYY`). */
    start_date?: string;
    /** The date the user finished watching, in ISO 8601 form; may be a partial date (`YYYY-MM` or `YYYY`). */
    finish_date?: string;
    /** Free-form notes the user attached to the entry. */
    comments?: string;
    /** Whether the user is currently rewatching the anime. */
    is_rewatching: boolean;
    /** The number of times the user has rewatched the anime. */
    num_times_rewatched: number;
    /** The rewatch value rating (0-5). */
    rewatch_value: number;
    /** The priority rating (0-2). */
    priority: number;
    /** User-defined tags attached to the entry, as a single comma-separated string. */
    tags: string;
    /** The server-managed timestamp of the last update, in ISO 8601 form. */
    updated_at?: string;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * The reading status of a manga on a user's MyAnimeList list.
 *
 * These are the five fixed values MyAnimeList accepts for the `status` field
 * of {@link MalMangaListStatusUpdate} and returns on {@link MalMangaListStatus}.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put
 */
export type MalMangaListStatusValue =
    "reading" | "completed" | "on_hold" | "dropped" | "plan_to_read";

/**
 * {@link MalMangaListStatusUpdate} is the form-urlencoded PATCH request body for updating a user's manga list status.
 *
 * Every field is optional: callers send only the fields they want to change. It is consumed by `MalMangaOperation.updateMyListStatus` and `MyAnimeListMangaApi.updateMyListStatus` against `PATCH /manga/{manga_id}/my_list_status`, which encodes it as `application/x-www-form-urlencoded` (MAL rejects JSON on this endpoint).
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put
 */
export interface MalMangaListStatusUpdate {
    /** The reading status to set; one of {@link MalMangaListStatusValue}. */
    status?: MalMangaListStatusValue;
    /** The number of chapters the user has read. */
    num_chapters_read?: number;
    /** The number of volumes the user has read. */
    num_volumes_read?: number;
    /** The user's score out of 10. */
    score?: number;
    /** The date the user started reading, in ISO 8601 form; MAL also accepts partial dates (`YYYY-MM` or `YYYY`). */
    start_date?: string;
    /** The date the user finished reading, in ISO 8601 form; MAL also accepts partial dates (`YYYY-MM` or `YYYY`). */
    finish_date?: string;
    /** Free-form notes the user attached to the entry. */
    comments?: string;
    /** Whether the user is currently rereading the manga. */
    is_rereading?: boolean;
    /** The number of times the user has reread the manga. */
    num_times_reread?: number;
    /** The reread value rating (0-5). */
    reread_value?: number;
    /** The priority rating (0-2). */
    priority?: number;
    /** User-defined tags attached to the entry; sent as a comma-separated string. */
    tags?: readonly string[];
}

/**
 * {@link MalMangaListStatus} is the response returned by MyAnimeList for a user's manga list status.
 *
 * It is the shape returned by `MalMangaOperation.updateMyListStatus` and `MyAnimeListMangaApi.updateMyListStatus` from `PATCH /manga/{manga_id}/my_list_status`. MyAnimeList returns `tags` as a single comma-separated string and reports the chapter count as `num_chapters_read`; the server-managed `updated_at` timestamp is included when set.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put
 */
export interface MalMangaListStatus {
    /** The current reading status; one of {@link MalMangaListStatusValue}. */
    status: MalMangaListStatusValue;
    /** The number of chapters the user has read. */
    num_chapters_read: number;
    /** The number of volumes the user has read. */
    num_volumes_read: number;
    /** The user's score out of 10. */
    score: number;
    /** The date the user started reading, in ISO 8601 form; may be a partial date (`YYYY-MM` or `YYYY`). */
    start_date?: string;
    /** The date the user finished reading, in ISO 8601 form; may be a partial date (`YYYY-MM` or `YYYY`). */
    finish_date?: string;
    /** Free-form notes the user attached to the entry. */
    comments?: string;
    /** Whether the user is currently rereading the manga. */
    is_rereading: boolean;
    /** The number of times the user has reread the manga. */
    num_times_reread: number;
    /** The reread value rating (0-5). */
    reread_value: number;
    /** The priority rating (0-2). */
    priority: number;
    /** User-defined tags attached to the entry, as a single comma-separated string. */
    tags: string;
    /** The server-managed timestamp of the last update, in ISO 8601 form. */
    updated_at?: string;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}
