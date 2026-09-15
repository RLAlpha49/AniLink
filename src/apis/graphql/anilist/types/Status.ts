/**
 * {@link MediaStatus} is the AniList MediaStatus enum: the release status of a media itself
 * (whether it is airing/publishing), not the viewer's watch status.
 * @see https://docs.anilist.co/reference/enum/mediastatus
 */
export type MediaStatus = "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";

/**
 * {@link MediaStatusMappings} is the allowlist of {@link MediaStatus} values accepted by
 * the `status`/`status_in`/`status_not`/`status_not_in` filters of the media queries.
 * @see https://docs.anilist.co/reference/enum/mediastatus
 */
export const MediaStatusMappings: readonly MediaStatus[] = [
    "FINISHED",
    "RELEASING",
    "NOT_YET_RELEASED",
    "CANCELLED",
    "HIATUS",
];

/**
 * {@link MediaListStatus} is the AniList MediaListStatus enum: the viewer's watch/reading
 * status on a list entry, set by the list-entry mutations and filterable on the list queries.
 * @see https://docs.anilist.co/reference/enum/medialiststatus
 */
export type MediaListStatus =
    "CURRENT" | "PLANNING" | "COMPLETED" | "DROPPED" | "PAUSED" | "REPEATING";

/**
 * {@link MediaListStatusMappings} is the allowlist of {@link MediaListStatus} values accepted
 * by the list-entry mutations and the `status` filters of the list queries.
 * @see https://docs.anilist.co/reference/enum/medialiststatus
 */
export const MediaListStatusMappings: readonly MediaListStatus[] = [
    "CURRENT",
    "PLANNING",
    "COMPLETED",
    "DROPPED",
    "PAUSED",
    "REPEATING",
];
