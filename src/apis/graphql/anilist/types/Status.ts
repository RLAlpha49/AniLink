/**
 * {@link MediaStatus} is a type that represents the status of a media.
 * It can be one of the following: 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'.
 * @see https://docs.anilist.co/reference/enum/mediastatus
 */
export type MediaStatus = "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";

/**
 * {@link MediaStatusMappings} is a mapping of {@link MediaStatus} enum values to their corresponding string values.
 * It can be one of the following: 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'.
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
 * {@link MediaListStatus} is a type that represents the status of a media list.
 * It can be one of the following: 'CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', 'REPEATING'.
 * @see https://docs.anilist.co/reference/enum/medialiststatus
 */
export type MediaListStatus =
    "CURRENT" | "PLANNING" | "COMPLETED" | "DROPPED" | "PAUSED" | "REPEATING";

/**
 * {@link MediaListStatusMappings} is a mapping of {@link MediaListStatus} enum values to their corresponding string values.
 * It can be one of the following: 'CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', 'REPEATING'.
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
