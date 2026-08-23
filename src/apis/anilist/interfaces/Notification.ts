import { type BasicComment, type BasicThread, type BasicUser } from "./Basic";
import { type Title } from "./Title";

/**
 * `NotificationOptionInput` is an interface representing the options for a notification.
 * It includes the type and enabled status each having their own properties.
 * @see https://docs.anilist.co/reference/input/notificationoptioninput
 */
export interface NotificationOptionInput {
    /**
     * `type` is a string representing the type of the notification.
     */
    type: string;

    /**
     * `enabled` is a boolean representing whether the notification is enabled or not.
     */
    enabled: boolean;
}

/**
 * `ThreadNotification` is an interface representing a thread notification.
 * It includes the id, userId, type, commentId, context, createdAt, thread, comment, and user each having their own properties.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface ThreadNotification {
    /**
     * `id` is a number representing the id of the thread notification.
     */
    id: number;

    /**
     * `userId` is a number representing the id of the user associated with the thread notification.
     */
    userId: number;

    /**
     * `type` is the notification type discriminator of the thread notification.
     * It is one of "THREAD_COMMENT_MENTION", "THREAD_COMMENT_REPLY", "THREAD_SUBSCRIBED", or "THREAD_COMMENT_LIKE",
     * which lets `NotificationResponse` work as a discriminated union.
     */
    type:
        | "THREAD_COMMENT_MENTION"
        | "THREAD_COMMENT_REPLY"
        | "THREAD_SUBSCRIBED"
        | "THREAD_COMMENT_LIKE";

    /**
     * `commentId` is a number representing the id of the comment associated with the thread notification.
     */
    commentId: number;

    /**
     * `context` is a string representing the context of the thread notification.
     */
    context: string;

    /**
     * `createdAt` is a number representing the timestamp when the thread notification was created.
     */
    createdAt: number;

    /**
     * `thread` is an instance of `BasicThread` representing the thread associated with the thread notification.
     */
    thread: BasicThread;

    /**
     * `comment` is an instance of `BasicComment` representing the comment associated with the thread notification.
     */
    comment: BasicComment;

    /**
     * `user` is an instance of `BasicUser` representing the user associated with the thread notification.
     */
    user: BasicUser;
}

/**
 * `AiringNotification` is an interface representing an airing notification.
 * It includes the id, type, animeId, episode, contexts, createdAt, and media of the notification.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface AiringNotification {
    /**
     * `id` is a number representing the id of the airing notification.
     */
    id: number;

    /**
     * `type` is the notification type discriminator of the airing notification.
     * It is always "AIRING", which lets `NotificationResponse` work as a discriminated union.
     */
    type: "AIRING";

    /**
     * `animeId` is a number representing the id of the anime associated with the airing notification.
     */
    animeId: number;

    /**
     * `episode` is a number representing the episode number of the anime associated with the airing notification.
     */
    episode: number;

    /**
     * `contexts` is a string representing the contexts of the airing notification.
     */
    contexts: string;

    /**
     * `createdAt` is a number representing the timestamp when the airing notification was created.
     */
    createdAt: number;

    /**
     * `media` is an object representing the media associated with the airing notification.
     * It includes the id and title of the media.
     */
    media: {
        /**
         * `id` is a number representing the id of the media.
         */
        id: number;

        /**
         * `title` is an instance of `Title` representing the title of the media.
         */
        title: Title;
    };
}

/**
 * `FollowingNotification` is an interface representing a following notification.
 * It includes the id, type, userId, context, createdAt, and user of the notification.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface FollowingNotification {
    /**
     * `id` is a number representing the id of the following notification.
     */
    id: number;

    /**
     * `type` is the notification type discriminator of the following notification.
     * It is always "FOLLOWING", which lets `NotificationResponse` work as a discriminated union.
     */
    type: "FOLLOWING";

    /**
     * `userId` is a number representing the id of the user associated with the following notification.
     */
    userId: number;

    /**
     * `context` is a string representing the context of the following notification.
     */
    context: string;

    /**
     * `createdAt` is a number representing the timestamp when the following notification was created.
     */
    createdAt: number;

    /**
     * `user` is an instance of `BasicUser` representing the user associated with the following notification.
     */
    user: BasicUser;
}

/**
 * `ActivityMessageNotification` is an interface representing an activity message notification.
 * It includes the id, userId, type, activityId, context, createdAt, message, and user of the notification.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface ActivityMessageNotification {
    /**
     * `id` is a number representing the id of the activity message notification.
     */
    id: number;

    /**
     * `userId` is a number representing the id of the user associated with the activity message notification.
     */
    userId: number;

    /**
     * `type` is the notification type discriminator of the activity message notification.
     * It is always "ACTIVITY_MESSAGE", which lets `NotificationResponse` work as a discriminated union.
     */
    type: "ACTIVITY_MESSAGE";

    /**
     * `activityId` is a number representing the id of the activity associated with the activity message notification.
     */
    activityId: number;

    /**
     * `context` is a string representing the context of the activity message notification.
     */
    context: string;

    /**
     * `createdAt` is a number representing the timestamp when the activity message notification was created.
     */
    createdAt: number;

    /**
     * `message` is an object representing the message associated with the activity message notification.
     * It includes the id, recipientId, messengerId, type, replyCount, message, isLocked, isSubscribed, likeCount, isLiked, isPrivate, siteUrl, createdAt, replies, and likes of the message.
     */
    message: {
        /**
         * `id` is a number representing the id of the message.
         */
        id: number;

        /**
         * `recipientId` is a number representing the id of the recipient of the message.
         */
        recipientId: number;

        /**
         * `messengerId` is a number representing the id of the messenger of the message.
         */
        messengerId: number;

        /**
         * `type` is a string representing the type of the message.
         */
        type: string;

        /**
         * `replyCount` is a number representing the reply count of the message.
         */
        replyCount: number;

        /**
         * `message` is a string representing the content of the message.
         */
        message: string;

        /**
         * `isLocked` is a boolean indicating whether the message is locked.
         */
        isLocked: boolean;

        /**
         * `isSubscribed` is a boolean indicating whether the user is subscribed to the message.
         */
        isSubscribed: boolean;

        /**
         * `likeCount` is a number representing the like count of the message.
         */
        likeCount: number;

        /**
         * `isLiked` is a boolean indicating whether the message is liked by the user.
         */
        isLiked: boolean;

        /**
         * `isPrivate` is a boolean indicating whether the message is private.
         */
        isPrivate: boolean;

        /**
         * `siteUrl` is a string representing the URL of the message on the site.
         */
        siteUrl: string;

        /**
         * `createdAt` is a number representing the timestamp when the message was created.
         */
        createdAt: number;

        /**
         * `replies` is an array of objects representing the replies to the message.
         * Each object includes the id, userId, activityId, text, createdAt, likeCount, isLiked, user, and likes of the reply.
         */
        replies: Array<{
            /**
             * `id` is a number representing the id of the reply.
             */
            id: number;

            /**
             * `userId` is a number representing the id of the user who replied.
             */
            userId: number;

            /**
             * `activityId` is a number representing the id of the activity associated with the reply.
             */
            activityId: number;

            /**
             * `text` is a string representing the content of the reply.
             */
            text: string;

            /**
             * `createdAt` is a number representing the timestamp when the reply was created.
             */
            createdAt: number;

            /**
             * `likeCount` is a number representing the like count of the reply.
             */
            likeCount: number;

            /**
             * `isLiked` is a boolean indicating whether the reply is liked by the user.
             */
            isLiked: boolean;

            /**
             * `user` is an instance of `BasicUser` representing the user who replied.
             */
            user: BasicUser;

            /**
             * `likes` is an array of instances of `BasicUser` representing the users who liked the reply.
             */
            likes: BasicUser[];
        }>;

        /**
         * `likes` is an array of instances of `BasicUser` representing the users who liked the message.
         */
        likes: BasicUser[];
    };

    /**
     * `user` is an instance of `BasicUser` representing the user associated with the activity message notification.
     */
    user: BasicUser;
}

/**
 * `ThreadLikeNotification` is an interface representing a thread like notification.
 * It includes the id, userId, type, context, createdAt, thread, comment, and user of the notification.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface ThreadLikeNotification {
    /**
     * `id` is a number representing the id of the thread like notification.
     */
    id: number;

    /**
     * `userId` is a number representing the id of the user associated with the thread like notification.
     */
    userId: number;

    /**
     * `type` is the notification type discriminator of the thread like notification.
     * It is always "THREAD_LIKE", which lets `NotificationResponse` work as a discriminated union.
     */
    type: "THREAD_LIKE";

    /**
     * `context` is a string representing the context of the thread like notification.
     */
    context: string;

    /**
     * `createdAt` is a number representing the timestamp when the thread like notification was created.
     */
    createdAt: number;

    /**
     * `thread` is an instance of `BasicThread` representing the thread associated with the thread like notification.
     */
    thread: BasicThread;

    /**
     * `comment` is an instance of `BasicComment` representing the comment associated with the thread like notification.
     */
    comment: BasicComment;

    /**
     * `user` is an instance of `BasicUser` representing the user associated with the thread like notification.
     */
    user: BasicUser;
}

/**
 * `RelatedMediaAdditionNotification` is an interface representing a related media addition notification.
 * It includes the id, type, mediaId, context, createdAt, and media of the notification.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface RelatedMediaAdditionNotification {
    /**
     * `id` is a number representing the id of the related media addition notification.
     */
    id: number;

    /**
     * `type` is the notification type discriminator of the related media addition notification.
     * It is always "RELATED_MEDIA_ADDITION", which lets `NotificationResponse` work as a discriminated union.
     */
    type: "RELATED_MEDIA_ADDITION";

    /**
     * `mediaId` is a number representing the id of the media associated with the related media addition notification.
     */
    mediaId: number;

    /**
     * `context` is a string representing the context of the related media addition notification.
     */
    context: string;

    /**
     * `createdAt` is a number representing the timestamp when the related media addition notification was created.
     */
    createdAt: number;

    /**
     * `media` is an object representing the media associated with the related media addition notification.
     * It includes the id and title of the media.
     */
    media: {
        /**
         * `id` is a number representing the id of the media.
         */
        id: number;

        /**
         * `title` is an instance of `Title` representing the title of the media.
         */
        title: Title;
    };
}

/**
 * `MediaDataChangeNotification` is an interface representing a media data change notification.
 * It includes the id, type, mediaId, context, reason, createdAt, and media of the notification.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface MediaDataChangeNotification {
    /**
     * `id` is a number representing the id of the media data change notification.
     */
    id: number;

    /**
     * `type` is the notification type discriminator of the media data change notification.
     * It is always "MEDIA_DATA_CHANGE", which lets `NotificationResponse` work as a discriminated union.
     */
    type: "MEDIA_DATA_CHANGE";

    /**
     * `mediaId` is a number representing the id of the media associated with the media data change notification.
     */
    mediaId: number;

    /**
     * `context` is a string representing the context of the media data change notification.
     */
    context: string;

    /**
     * `reason` is a string representing the reason for the media data change.
     */
    reason: string;

    /**
     * `createdAt` is a number representing the timestamp when the media data change notification was created.
     */
    createdAt: number;

    /**
     * `media` is an object representing the media associated with the media data change notification.
     * It includes the id and title of the media.
     */
    media: {
        /**
         * `id` is a number representing the id of the media.
         */
        id: number;

        /**
         * `title` is an instance of `Title` representing the title of the media.
         */
        title: Title;
    };
}

/**
 * `MediaMergeNotification` is an interface representing a media merge notification.
 * It includes the id, type, mediaId, deletedMediaTitles, context, reason, createdAt, and media of the notification.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface MediaMergeNotification {
    /**
     * `id` is a number representing the id of the media merge notification.
     */
    id: number;

    /**
     * `type` is the notification type discriminator of the media merge notification.
     * It is always "MEDIA_MERGE", which lets `NotificationResponse` work as a discriminated union.
     */
    type: "MEDIA_MERGE";

    /**
     * `mediaId` is a number representing the id of the media associated with the media merge notification.
     */
    mediaId: number;

    /**
     * `deletedMediaTitles` is an array of strings representing the titles of the deleted media in the media merge notification.
     */
    deletedMediaTitles: string[];

    /**
     * `context` is a string representing the context of the media merge notification.
     */
    context: string;

    /**
     * `reason` is a string representing the reason for the media merge.
     */
    reason: string;

    /**
     * `createdAt` is a number representing the timestamp when the media merge notification was created.
     */
    createdAt: number;

    /**
     * `media` is an object representing the media associated with the media merge notification.
     * It includes the id and title of the media.
     */
    media: {
        /**
         * `id` is a number representing the id of the media.
         */
        id: number;

        /**
         * `title` is an instance of `Title` representing the title of the media.
         */
        title: Title;
    };
}

/**
 * `MediaDeletionNotification` is an interface representing a media deletion notification.
 * It includes the id, type, deletedMediaTitle, context, reason, and createdAt of the notification.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface MediaDeletionNotification {
    /**
     * `id` is a number representing the id of the media deletion notification.
     */
    id: number;

    /**
     * `type` is the notification type discriminator of the media deletion notification.
     * It is always "MEDIA_DELETION", which lets `NotificationResponse` work as a discriminated union.
     */
    type: "MEDIA_DELETION";

    /**
     * `deletedMediaTitle` is a string representing the title of the deleted media in the media deletion notification.
     */
    deletedMediaTitle: string;

    /**
     * `context` is a string representing the context of the media deletion notification.
     */
    context: string;

    /**
     * `reason` is a string representing the reason for the media deletion.
     */
    reason: string;

    /**
     * `createdAt` is a number representing the timestamp when the media deletion notification was created.
     */
    createdAt: number;
}
