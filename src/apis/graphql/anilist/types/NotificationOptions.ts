/**
 * {@link NotificationOptions} is one per-notification-type toggle: whether AniList sends that
 * `type` of notification. `UpdateUser` accepts a list of them as `notificationOptions`.
 * @see https://docs.anilist.co/reference/object/notificationoption
 */
export type NotificationOptions = {
    /**
     * `type` is a string representing the type of notification.
     */
    type:
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
     * `enabled` is a boolean indicating whether the notification is enabled or not.
     */
    enabled: boolean;
};

/**
 * {@link NotificationOptionsMapping} is the field-shape map `UpdateUser` validates its
 * `notificationOptions` entries against before dispatch.
 * @see https://docs.anilist.co/reference/object/notificationoption
 */
export const NotificationOptionsMapping = {
    type: [
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
    ],
    enabled: "boolean",
};
