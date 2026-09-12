import type { MalPaging, MalPicture, MalRequestOptions } from "./common";

/**
 * MyAnimeList anime types: the {@link MalAnime} entity and its broadcast
 * node, the seasonal, ranking, and suggestion reads, the anime list-status
 * write, and the user anime-list read.
 */

/**
 * {@link MalBroadcast} is the broadcast schedule node of a MyAnimeList anime.
 *
 * It is the `broadcast` field inside {@link MalAnime}, selected via {@link MalRequestOptions.fields} through `MalAnimeOperation.get` and `MyAnimeListAnimeApi.get`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 */
export interface MalBroadcast {
    /** The day of the week the anime broadcasts in Japan time, or `other`. */
    day_of_the_week?: string;
    /** The broadcast start time in JST in `HH:mm` form, when MyAnimeList provides one. */
    start_time?: string;
}

/**
 * {@link MalAnime} is the typed portion of a MyAnimeList anime response returned by `MalAnimeOperation.get` and `MyAnimeListAnimeApi.get`.
 *
 * It always carries `id` and `title`; additional fields appear when requested via {@link MalRequestOptions.fields} — or, when `fields` is omitted, via the {@link DEFAULT_MAL_ANIME_FIELDS} fallback — and are exposed through the index signature without narrowing.
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
    broadcast?: MalBroadcast;
    /** The average episode duration in seconds, when requested via the `fields` query parameter. */
    average_episode_duration?: number;
    /** Any additional fields requested by a caller remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * The four broadcast seasons MyAnimeList partitions seasonal anime into.
 *
 * These are the fixed `season` path values accepted by
 * `GET /anime/season/{year}/{season}`, consumed as the `season` parameter of
 * `MalAnimeOperation.seasonal` and `MyAnimeListAnimeApi.seasonal`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get
 */
export type MalSeason = "winter" | "spring" | "summer" | "fall";

/**
 * The ranking lists MyAnimeList exposes for anime.
 *
 * These are the fixed `ranking_type` query values accepted by
 * `GET /anime/ranking`, consumed as the `rankingType` parameter of
 * `MalAnimeOperation.ranking` and `MyAnimeListAnimeApi.ranking`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get
 */
export type MalRankingType =
    | "all"
    | "airing"
    | "upcoming"
    | "tv"
    | "ova"
    | "movie"
    | "special"
    | "bypopularity"
    | "favorite";

/**
 * {@link MalSeasonalAnime} is one entry of a seasonal anime list.
 *
 * It wraps the {@link MalAnime} node, and is the element type of
 * {@link MalSeasonalAnimeResponse} returned by `MalAnimeOperation.seasonal` and
 * `MyAnimeListAnimeApi.seasonal`. The entry's rank within the season, when
 * requested, is a `rank` field on the node itself, not a wrapper.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get
 */
export interface MalSeasonalAnime {
    /** The anime entry, shaped by the `fields` query parameter. */
    node: MalAnime;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalRankingEntry} is one entry of an anime ranking list.
 *
 * It wraps the {@link MalAnime} node with its `ranking` position, and is the
 * element type of {@link MalAnimeRankingResponse} returned by
 * `MalAnimeOperation.ranking` and `MyAnimeListAnimeApi.ranking`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get
 */
export interface MalRankingEntry {
    /** The anime entry, shaped by the `fields` query parameter. */
    node: MalAnime;
    /** The entry's rank within the requested ranking list. */
    ranking: { rank: number };
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalSeasonalAnimeResponse} is the response of the seasonal anime endpoint.
 *
 * It is the shape returned by `MalAnimeOperation.seasonal` and
 * `MyAnimeListAnimeApi.seasonal` from `GET /anime/season/{year}/{season}`: a
 * page of {@link MalSeasonalAnime} entries plus the {@link MalPaging} node.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get
 */
export interface MalSeasonalAnimeResponse {
    /** The seasonal anime entries on this page. */
    data: MalSeasonalAnime[];
    /** The paging node with the next-page URL, when the list continues. */
    paging?: MalPaging;
}

/**
 * {@link MalAnimeRankingResponse} is the response of the anime ranking endpoint.
 *
 * It is the shape returned by `MalAnimeOperation.ranking` and
 * `MyAnimeListAnimeApi.ranking` from `GET /anime/ranking`: a page of
 * {@link MalRankingEntry} entries plus the {@link MalPaging} node.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get
 */
export interface MalAnimeRankingResponse {
    /** The ranking entries on this page. */
    data: MalRankingEntry[];
    /** The paging node with the next-page URL, when the list continues. */
    paging?: MalPaging;
}

/**
 * {@link MalSuggestion} is one entry of the anime suggestions list.
 *
 * It wraps the {@link MalAnime} node without a ranking position, and is the
 * element type of {@link MalAnimeSuggestionsResponse} returned by
 * `MalAnimeOperation.suggestions` and `MyAnimeListAnimeApi.suggestions`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_suggestions_get
 */
export interface MalSuggestion {
    /** The suggested anime entry, shaped by the `fields` query parameter. */
    node: MalAnime;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalAnimeSuggestionsResponse} is the response of the anime suggestions endpoint.
 *
 * It is the shape returned by `MalAnimeOperation.suggestions` and
 * `MyAnimeListAnimeApi.suggestions` from `GET /anime/suggestions`: a page of
 * {@link MalSuggestion} entries (no ranking wrapper) plus the {@link MalPaging}
 * node.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_suggestions_get
 */
export interface MalAnimeSuggestionsResponse {
    /** The suggested anime entries on this page. */
    data: MalSuggestion[];
    /** The paging node with the next-page URL, when the list continues. */
    paging?: MalPaging;
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
 * It is the shape returned by `MalAnimeOperation.updateMyListStatus` and `MyAnimeListAnimeApi.updateMyListStatus` from `PATCH /anime/{anime_id}/my_list_status`. MyAnimeList returns `tags` as an array of strings and reports the episode count as `num_episodes_watched` (the request field is `num_watched_episodes` — a documented MAL asymmetry); the server-managed `updated_at` timestamp is included when set.
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
    /** User-defined tags attached to the entry, as an array of strings. */
    tags: string[];
    /** The server-managed timestamp of the last update, in ISO 8601 form. */
    updated_at?: string;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * The sort orders MyAnimeList accepts for a user's anime list.
 *
 * These are the fixed `sort` query values accepted by
 * `GET /users/{user_name}/animelist`, consumed as the `sort` field of
 * {@link MalUserAnimeListOptions} on `MalUserOperation.animeList` and
 * `MyAnimeListUserApi.animeList`. `list_score`, `list_updated_at`, and
 * `anime_start_date` sort descending; `anime_title` and `anime_id` sort
 * ascending (`anime_id` is listed as under development by MyAnimeList).
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
 */
export type MalAnimeListSort =
    "list_score" | "list_updated_at" | "anime_title" | "anime_start_date" | "anime_id";

/**
 * {@link MalUserAnimeListOptions} is the request options for reading a user's anime list.
 *
 * It extends {@link MalRequestOptions} with the `status`, `sort`, `limit`, and
 * `offset` query parameters accepted by `GET /users/{user_name}/animelist`,
 * consumed by `MalUserOperation.animeList` and `MyAnimeListUserApi.animeList`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
 */
export interface MalUserAnimeListOptions extends MalRequestOptions {
    /** The watch status to filter by; one of {@link MalAnimeListStatusValue}. Omit to return all. */
    status?: MalAnimeListStatusValue;
    /** The sort order; one of {@link MalAnimeListSort}. */
    sort?: MalAnimeListSort;
    /** The number of entries per page; defaults to 100, capped at 1000 by MyAnimeList. */
    limit?: number;
    /** The offset of the first entry; defaults to 0. */
    offset?: number;
}

/**
 * {@link MalUserAnimeListEntry} is one entry of a user's anime list.
 *
 * It wraps the {@link MalAnime} node with its {@link MalAnimeListStatus} list
 * status, and is the element type of {@link MalUserAnimeListResponse} returned
 * by `MalUserOperation.animeList` and `MyAnimeListUserApi.animeList`. The
 * `list_status` wrapper appears when requested via
 * {@link MalRequestOptions.fields} (for example `list_status{priority,comments}`).
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
 */
export interface MalUserAnimeListEntry {
    /** The anime entry, shaped by the `fields` query parameter. */
    node: MalAnime;
    /** The entry's list status, when requested via `fields`. */
    list_status?: MalAnimeListStatus;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalUserAnimeListResponse} is the response of the user anime list endpoint.
 *
 * It is the shape returned by `MalUserOperation.animeList` and
 * `MyAnimeListUserApi.animeList` from `GET /users/{user_name}/animelist`: a
 * page of {@link MalUserAnimeListEntry} entries plus the {@link MalPaging}
 * node with `next`/`previous` URLs.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
 */
export interface MalUserAnimeListResponse {
    /** The anime list entries on this page. */
    data: MalUserAnimeListEntry[];
    /** The paging node with the next/previous page URLs, when the list continues. */
    paging?: MalPaging;
}
