import type { MalAnimeListSort, MalAnimeListStatusValue } from "./anime";
import type { MalMangaListSort, MalMangaListStatusValue } from "./manga";

/**
 * MyAnimeList user types: the {@link MalUser} entity returned by
 * `MalUserOperation.me`, plus the params objects of the user-list reads.
 */

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
    /** The user's profile picture URL, when requested via the `fields` query parameter. */
    picture?: string;
    /** The user's gender, when requested via the `fields` query parameter. */
    gender?: string;
    /** The user's birthday in ISO 8601 format, when requested via the `fields` query parameter. */
    birthday?: string;
    /** Any additional fields requested by a caller remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalUserAnimeListParams} is the params object of the user anime-list read.
 *
 * It carries the API's own inputs for `GET /users/{user_name}/animelist` —
 * the `username` path segment plus the `status`, `sort`, `limit`, and
 * `offset` query filters — consumed by `MalUserOperation.animeList` and
 * `MyAnimeListUserApi.animeList` as the single params object of the unified
 * `(params, options?)` convention.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
 */
export interface MalUserAnimeListParams {
    /** The MyAnimeList username, or `@me` for the authenticated user. */
    username: string;
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
 * {@link MalUserMangaListParams} is the params object of the user manga-list read.
 *
 * It carries the API's own inputs for `GET /users/{user_name}/mangalist` —
 * the `username` path segment plus the `status`, `sort`, `limit`, and
 * `offset` query filters — consumed by `MalUserOperation.mangaList` and
 * `MyAnimeListUserApi.mangaList` as the single params object of the unified
 * `(params, options?)` convention.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
 */
export interface MalUserMangaListParams {
    /** The MyAnimeList username, or `@me` for the authenticated user. */
    username: string;
    /** The reading status to filter by; one of {@link MalMangaListStatusValue}. Omit to return all. */
    status?: MalMangaListStatusValue;
    /** The sort order; one of {@link MalMangaListSort}. */
    sort?: MalMangaListSort;
    /** The number of entries per page; defaults to 100, capped at 1000 by MyAnimeList. */
    limit?: number;
    /** The offset of the first entry; defaults to 0. */
    offset?: number;
}
