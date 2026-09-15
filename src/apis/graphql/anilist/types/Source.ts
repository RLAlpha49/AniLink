/**
 * {@link MediaSource} is the AniList MediaSource enum: the work a media was adapted from
 * (`ORIGINAL` when there is none).
 * @see https://docs.anilist.co/reference/enum/mediasource
 */
export type MediaSource =
    | "ORIGINAL"
    | "MANGA"
    | "LIGHT_NOVEL"
    | "VISUAL_NOVEL"
    | "VIDEO_GAME"
    | "OTHER"
    | "NOVEL"
    | "DOUJINSHI"
    | "ANIME"
    | "WEB_NOVEL"
    | "LIVE_ACTION"
    | "GAME"
    | "BOOK"
    | "MUSIC"
    | "MULTIMEDIA_PROJECT"
    | "PICTURE_BOOK";

/**
 * {@link MediaSourceMappings} is the allowlist of {@link MediaSource} values accepted by
 * the `source`/`source_in` filters of the media queries.
 * @see https://docs.anilist.co/reference/enum/mediasource
 */
export const MediaSourceMappings: readonly MediaSource[] = [
    "ORIGINAL",
    "MANGA",
    "LIGHT_NOVEL",
    "VISUAL_NOVEL",
    "VIDEO_GAME",
    "OTHER",
    "NOVEL",
    "DOUJINSHI",
    "ANIME",
    "WEB_NOVEL",
    "LIVE_ACTION",
    "GAME",
    "BOOK",
    "MUSIC",
    "MULTIMEDIA_PROJECT",
    "PICTURE_BOOK",
];
