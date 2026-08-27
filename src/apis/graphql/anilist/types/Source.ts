/**
 * {@link MediaSource} is a type that represents the source of a media.
 * It can be one of the following: 'ORIGINAL', 'MANGA', 'LIGHT_NOVEL', 'VISUAL_NOVEL', 'VIDEO_GAME', 'OTHER', 'NOVEL', 'DOUJINSHI', 'ANIME', 'WEB_NOVEL', 'LIVE_ACTION', 'GAME', 'BOOK', 'MUSIC', 'MULTIMEDIA_PROJECT', 'PICTURE_BOOK'.
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
 * {@link MediaSourceMappings} is a mapping of {@link MediaSource} enum values to their corresponding string values.
 * It can be one of the following: 'ORIGINAL', 'MANGA', 'LIGHT_NOVEL', 'VISUAL_NOVEL', 'VIDEO_GAME', 'OTHER', 'NOVEL', 'DOUJINSHI', 'ANIME', 'WEB_NOVEL', 'LIVE_ACTION', 'GAME', 'BOOK', 'MUSIC', 'MULTIMEDIA_PROJECT', 'PICTURE_BOOK'.
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
