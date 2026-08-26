/**
 * `MediaType` is a type that represents the type of media.
 * It can be one of the following: 'ANIME', 'MANGA'.
 * @see https://docs.anilist.co/reference/enum/mediatype
 */
export type MediaType = "ANIME" | "MANGA";

/**
 * `MediaTypeMappings` is a mapping of `MediaType` enum values to their corresponding string values.
 * It can be one of the following: 'ANIME', 'MANGA'.
 * @see https://docs.anilist.co/reference/enum/mediatype
 */
export const MediaTypeMappings: readonly MediaType[] = ["ANIME", "MANGA"];

/**
 * `NotificationType` is a type that represents the type of notification.
 * It can be one of the following: 'ACTIVITY_MESSAGE', 'ACTIVITY_REPLY', 'FOLLOWING', 'ACTIVITY_MENTION', 'THREAD_COMMENT_MENTION', 'THREAD_SUBSCRIBED', 'THREAD_COMMENT_REPLY', 'AIRING', 'ACTIVITY_LIKE', 'ACTIVITY_REPLY_LIKE', 'THREAD_LIKE', 'THREAD_COMMENT_LIKE', 'ACTIVITY_REPLY_SUBSCRIBED', 'RELATED_MEDIA_ADDITION', 'MEDIA_DATA_CHANGE', 'MEDIA_MERGE', 'MEDIA_DELETION'.
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
 * `NotificationTypeMappings` is a mapping of `NotificationType` enum values to their corresponding string values.
 * It can be one of the following: 'ACTIVITY_MESSAGE', 'ACTIVITY_REPLY', 'FOLLOWING', 'ACTIVITY_MENTION', 'THREAD_COMMENT_MENTION', 'THREAD_SUBSCRIBED', 'THREAD_COMMENT_REPLY', 'AIRING', 'ACTIVITY_LIKE', 'ACTIVITY_REPLY_LIKE', 'THREAD_LIKE', 'THREAD_COMMENT_LIKE', 'ACTIVITY_REPLY_SUBSCRIBED', 'RELATED_MEDIA_ADDITION', 'MEDIA_DATA_CHANGE', 'MEDIA_MERGE', 'MEDIA_DELETION'.
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
 * `LikeableType` is a type that represents the type of likeable item.
 * It can be one of the following: 'THREAD', 'THREAD_COMMENT', 'ACTIVITY', 'ACTIVITY_REPLY'.
 * @see https://docs.anilist.co/reference/enum/likeabletype
 */
export type LikeableType = "THREAD" | "THREAD_COMMENT" | "ACTIVITY" | "ACTIVITY_REPLY";

/**
 * `LikeableTypeMappings` is a mapping of `LikeableType` enum values to their corresponding string values.
 * It can be one of the following: 'THREAD', 'THREAD_COMMENT', 'ACTIVITY', 'ACTIVITY_REPLY'.
 * @see https://docs.anilist.co/reference/enum/likeabletype
 */
export const LikeableTypeMappings: readonly LikeableType[] = [
    "THREAD",
    "THREAD_COMMENT",
    "ACTIVITY",
    "ACTIVITY_REPLY",
];
