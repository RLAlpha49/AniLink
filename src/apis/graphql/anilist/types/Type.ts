/**
 * {@link MediaType} is the AniList MediaType enum: whether a media entry is an anime or a manga.
 * Most list and media queries require it, because the two types share one id space.
 * @see https://docs.anilist.co/reference/enum/mediatype
 */
export type MediaType = "ANIME" | "MANGA";

/**
 * {@link MediaTypeMappings} is the allowlist of {@link MediaType} values accepted by the
 * `type`/`mediaType` variables of the media, list, and custom-list operations.
 * @see https://docs.anilist.co/reference/enum/mediatype
 */
export const MediaTypeMappings: readonly MediaType[] = ["ANIME", "MANGA"];

/**
 * {@link NotificationType} is the AniList NotificationType enum: the kind of a notification
 * feed item. The activity and thread variants mirror social events; the media variants
 * fire on upstream data changes.
 * @see https://docs.anilist.co/reference/enum/notificationtype
 */
export type NotificationType =
    | "ACTIVITY_MESSAGE"
    | "ACTIVITY_REPLY"
    | "FOLLOWING"
    | "ACTIVITY_MENTION"
    | "THREAD_COMMENT_MENTION"
    | "THREAD_SUBSCRIBED"
    | "THREAD_COMMENT_REPLY"
    | "AIRING"
    | "ACTIVITY_LIKE"
    | "ACTIVITY_REPLY_LIKE"
    | "THREAD_LIKE"
    | "THREAD_COMMENT_LIKE"
    | "ACTIVITY_REPLY_SUBSCRIBED"
    | "RELATED_MEDIA_ADDITION"
    | "MEDIA_DATA_CHANGE"
    | "MEDIA_MERGE"
    | "MEDIA_DELETION";

/**
 * {@link NotificationTypeMappings} is the allowlist of {@link NotificationType} values
 * accepted by the `type`/`type_in` filters of the notification queries.
 * @see https://docs.anilist.co/reference/enum/notificationtype
 */
export const NotificationTypeMappings: readonly NotificationType[] = [
    "ACTIVITY_MESSAGE",
    "ACTIVITY_REPLY",
    "FOLLOWING",
    "ACTIVITY_MENTION",
    "THREAD_COMMENT_MENTION",
    "THREAD_SUBSCRIBED",
    "THREAD_COMMENT_REPLY",
    "AIRING",
    "ACTIVITY_LIKE",
    "ACTIVITY_REPLY_LIKE",
    "THREAD_LIKE",
    "THREAD_COMMENT_LIKE",
    "ACTIVITY_REPLY_SUBSCRIBED",
    "RELATED_MEDIA_ADDITION",
    "MEDIA_DATA_CHANGE",
    "MEDIA_MERGE",
    "MEDIA_DELETION",
];

/**
 * {@link LikeableType} is the AniList LikeableType enum: the entity a like toggle targets.
 * `ToggleLike`/`ToggleLikeV2` take it as their `type` variable.
 * @see https://docs.anilist.co/reference/enum/likeabletype
 */
export type LikeableType = "THREAD" | "THREAD_COMMENT" | "ACTIVITY" | "ACTIVITY_REPLY";

/**
 * {@link LikeableTypeMappings} is the allowlist of {@link LikeableType} values accepted by
 * the `type` variable of the like-toggle mutations.
 * @see https://docs.anilist.co/reference/enum/likeabletype
 */
export const LikeableTypeMappings: readonly LikeableType[] = [
    "THREAD",
    "THREAD_COMMENT",
    "ACTIVITY",
    "ACTIVITY_REPLY",
];
