/**
 * {@link MediaFormat} is the AniList MediaFormat enum: the release format of a media
 * (episode count and medium follow from it — a `TV` series has episodes, a `MANGA` has chapters).
 * @see https://docs.anilist.co/reference/enum/mediaformat
 */
export type MediaFormat =
    | "TV"
    | "TV_SHORT"
    | "MOVIE"
    | "SPECIAL"
    | "OVA"
    | "ONA"
    | "MUSIC"
    | "MANGA"
    | "NOVEL"
    | "ONE_SHOT";

/**
 * {@link MediaFormatMappings} is the allowlist of {@link MediaFormat} values accepted by
 * the `format`/`format_in`/`format_not`/`format_not_in` filters of the media queries.
 * @see https://docs.anilist.co/reference/enum/mediaformat
 */
export const MediaFormatMappings: readonly MediaFormat[] = [
    "TV",
    "TV_SHORT",
    "MOVIE",
    "SPECIAL",
    "OVA",
    "ONA",
    "MUSIC",
    "MANGA",
    "NOVEL",
    "ONE_SHOT",
];

/**
 * {@link ScoreFormat} is the AniList ScoreFormat enum: the scale a user scores media on.
 * It is a user option (set via `UpdateUser`) that the list queries also filter by.
 * @see https://docs.anilist.co/reference/enum/scoreformat
 */
export type ScoreFormat = "POINT_100" | "POINT_10_DECIMAL" | "POINT_10" | "POINT_5" | "POINT_3";

/**
 * {@link ScoreFormatMapping} is the allowlist of {@link ScoreFormat} values accepted by
 * the `scoreFormat` variable of `UpdateUser` and the list queries.
 * @see https://docs.anilist.co/reference/enum/scoreformat
 */
export const ScoreFormatMapping: readonly ScoreFormat[] = [
    "POINT_100",
    "POINT_10_DECIMAL",
    "POINT_10",
    "POINT_5",
    "POINT_3",
];
