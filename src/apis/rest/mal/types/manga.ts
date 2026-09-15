import type { MalPaging, MalPicture } from "./common";

/**
 * MyAnimeList manga types: the {@link MalManga} entity, the manga list-status
 * write, and the user manga-list read.
 */

/**
 * {@link MalManga} is the typed portion of a MyAnimeList manga response returned by `MalMangaOperation.get` and `MyAnimeListMangaApi.get`.
 *
 * It always carries `id` and `title`; additional fields appear when requested via the `fields` request option and are exposed through the index signature without narrowing. Manga-specific fields such as `num_chapters` and `num_volumes` mirror the MyAnimeList manga endpoint shape.
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
    /** The media type, when requested (for example `manga`, `novel`, or `one_shot`). */
    media_type?: string;
    /** The first publication date in ISO 8601 format, when requested via the `fields` query parameter. */
    start_date?: string;
    /** The end publication date in ISO 8601 format, when requested via the `fields` query parameter. */
    end_date?: string;
    /** Any additional fields requested by a caller remain available without narrowing. */
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
 * Every field is optional: callers send only the fields they want to change. It is consumed by `MalMangaOperation.updateMyListStatus` and `MyAnimeListMangaApi.updateMyListStatus` against `PATCH /manga/{manga_id}/my_list_status`, which encodes it as `application/x-www-form-urlencoded` — the endpoint's only documented request format.
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
 * It is the shape returned by `MalMangaOperation.updateMyListStatus` and `MyAnimeListMangaApi.updateMyListStatus` from `PATCH /manga/{manga_id}/my_list_status`. MyAnimeList returns `tags` as an array of strings and reports the chapter count as `num_chapters_read`; the server-managed `updated_at` timestamp is included when set.
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
    /** User-defined tags attached to the entry, as an array of strings. */
    tags: string[];
    /** The server-managed timestamp of the last update, in ISO 8601 form. */
    updated_at?: string;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * The sort orders MyAnimeList accepts for a user's manga list.
 *
 * These are the fixed `sort` query values accepted by
 * `GET /users/{user_name}/mangalist`, consumed as the `sort` field of
 * `MalUserMangaListParams` on `MalUserOperation.mangaList` and
 * `MyAnimeListUserApi.mangaList`. `list_score`, `list_updated_at`, and
 * `manga_start_date` sort descending; `manga_title` and `manga_id` sort
 * ascending (`manga_id` is listed as under development by MyAnimeList).
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
 */
export type MalMangaListSort =
    "list_score" | "list_updated_at" | "manga_title" | "manga_start_date" | "manga_id";

/**
 * {@link MalMangaGetParams} is the params object of the manga lookup read.
 *
 * It carries the API's own inputs for `GET /manga/{id}`, consumed by
 * `MalMangaOperation.get` and `MyAnimeListMangaApi.get` as the single params
 * object of the unified `(params, options?)` convention.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
 */
export interface MalMangaGetParams {
    /** The MyAnimeList manga ID. */
    id: number;
}

/**
 * {@link MalMangaListStatusUpdateParams} is the params object of the manga list-status write.
 *
 * It extends {@link MalMangaListStatusUpdate} with the path `id` and carries
 * every input of `PATCH /manga/{id}/my_list_status`, consumed by
 * `MalMangaOperation.updateMyListStatus` and `MyAnimeListMangaApi.updateMyListStatus`
 * as the single params object of the unified `(params, options?)` convention.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put
 */
export interface MalMangaListStatusUpdateParams extends MalMangaListStatusUpdate {
    /** The MyAnimeList manga ID. */
    id: number;
}

/**
 * {@link MalMangaDeleteParams} is the params object of the manga list-status delete.
 *
 * It carries the API's own inputs for `DELETE /manga/{id}/my_list_status`,
 * consumed by `MalMangaOperation.deleteFromList` and
 * `MyAnimeListMangaApi.deleteFromList` as the single params object of the
 * unified `(params, options?)` convention.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_delete
 */
export interface MalMangaDeleteParams {
    /** The MyAnimeList manga ID. */
    id: number;
}

/**
 * {@link MalUserMangaListEntry} is one entry of a user's manga list.
 *
 * It wraps the {@link MalManga} node with its {@link MalMangaListStatus} list
 * status, and is the element type of {@link MalUserMangaListResponse} returned
 * by `MalUserOperation.mangaList` and `MyAnimeListUserApi.mangaList`. The
 * `list_status` wrapper appears when requested via
 * the `fields` request option (for example `fields=list_status`).
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
 */
export interface MalUserMangaListEntry {
    /** The manga entry, shaped by the `fields` query parameter. */
    node: MalManga;
    /** The entry's list status, when requested via `fields`. */
    list_status?: MalMangaListStatus;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalUserMangaListResponse} is the response of the user manga list endpoint.
 *
 * It is the shape returned by `MalUserOperation.mangaList` and
 * `MyAnimeListUserApi.mangaList` from `GET /users/{user_name}/mangalist`: a
 * page of {@link MalUserMangaListEntry} entries plus the {@link MalPaging}
 * node with `next`/`previous` URLs.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
 */
export interface MalUserMangaListResponse {
    /** The manga list entries on this page. */
    data: MalUserMangaListEntry[];
    /** The paging node with the next/previous page URLs, when the list continues. */
    paging?: MalPaging;
}
