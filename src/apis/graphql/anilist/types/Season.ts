/**
 * {@link MediaSeason} is the AniList MediaSeason enum: the broadcast season a media airs in.
 * Pair it with `seasonYear` on the media queries to scope a search to one season.
 * @see https://docs.anilist.co/reference/enum/mediaseason
 */
export type MediaSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

/**
 * {@link MediaSeasonMappings} is the allowlist of {@link MediaSeason} values accepted by
 * the `season` filter of the media queries.
 * @see https://docs.anilist.co/reference/enum/mediaseason
 */
export const MediaSeasonMappings: readonly MediaSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];
