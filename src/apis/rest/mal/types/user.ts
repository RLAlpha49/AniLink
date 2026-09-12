/**
 * MyAnimeList user types: the {@link MalUser} entity returned by
 * `MalUserOperation.me`.
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
