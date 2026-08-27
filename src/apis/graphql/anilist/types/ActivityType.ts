/**
 * {@link ActivityType} is a type that represents the type of activity.
 * It can be one of the following: 'TEXT', 'ANIME_LIST', 'MANGA_LIST', 'MESSAGE', 'MEDIA_LIST'.
 * @see https://docs.anilist.co/reference/enum/activitytype
 */
export type ActivityType = "TEXT" | "ANIME_LIST" | "MANGA_LIST" | "MESSAGE" | "MEDIA_LIST";

/**
 * {@link ActivityTypeMappings} is a mapping of {@link ActivityType} enum values to their corresponding string values.
 * It can be one of the following: 'TEXT', 'ANIME_LIST', 'MANGA_LIST', 'MESSAGE', 'MEDIA_LIST'.
 * @see https://docs.anilist.co/reference/enum/activitytype
 */
export const ActivityTypeMappings: readonly ActivityType[] = [
    "TEXT",
    "ANIME_LIST",
    "MANGA_LIST",
    "MESSAGE",
    "MEDIA_LIST",
];
