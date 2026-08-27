/**
 * {@link MediaSeason} is a type that represents the season of a media.
 * It can be one of the following: 'WINTER', 'SPRING', 'SUMMER', 'FALL'.
 * @see https://docs.anilist.co/reference/enum/mediaseason
 */
export type MediaSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

/**
 * {@link MediaSeasonMappings} is a mapping of {@link MediaSeason} enum values to their corresponding string values.
 * It can be one of the following: 'WINTER', 'SPRING', 'SUMMER', 'FALL'.
 * @see https://docs.anilist.co/reference/enum/mediaseason
 */
export const MediaSeasonMappings: readonly MediaSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];
