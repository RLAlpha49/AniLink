/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type BasicComment, type BasicThread, type BasicUser } from "./Basic";
/**
 * `ThreadNotification` — a thread-comment notification; narrow on the literal `type` field.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface ThreadNotification {
    /**
     * The id of the Notification
     */
    id: number;

    /**
     * The id of the user who mentioned the authenticated user
     */
    userId: number;

    /**
     * The type of notification
     */
    type:
        | "THREAD_COMMENT_MENTION"
        | "THREAD_COMMENT_REPLY"
        | "THREAD_SUBSCRIBED"
        | "THREAD_COMMENT_LIKE";

    /**
     * The id of the comment where mentioned
     */
    commentId: number;

    /**
     * The notification context text
     */
    context: string;

    /**
     * The time the notification was created at
     */
    createdAt: number;

    /**
     * The thread that the relevant comment belongs to
     */
    thread: BasicThread;

    /**
     * The thread comment that included the @ mention
     */
    comment: BasicComment;

    /**
     * The user who mentioned the authenticated user
     */
    user: BasicUser;
}

/**
 * `AiringNotification` — an episode-airing notification; `type` is always "AIRING".
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface AiringNotification {
    /**
     * The id of the Notification
     */
    id: number;

    /**
     * The type of notification
     */
    type: "AIRING";

    /**
     * The id of the aired anime
     */
    animeId: number;

    /**
     * The episode number that just aired
     */
    episode: number;

    /**
     * The notification context text
     */
    contexts: string[];

    /**
     * The time the notification was created at
     */
    createdAt: number;

    /**
     * The associated media of the airing schedule
     */
    media: {
        /**
         * The id of the media
         */
        id: number;

        /**
         * The official titles of the media in various languages
         */
        title: {
            /**
             * The romanization of the native language title
             */
            romaji: string;

            /**
             * The official english title
             */
            english: string;

            /**
             * Official title in it's native language
             */
            native: string;

            /**
             * The currently authenticated users preferred title language. Default romaji for non-authenticated
             */
            userPreferred: string;
        };
    };
}

/**
 * `FollowingNotification` — a new-follower notification; `type` is always "FOLLOWING".
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface FollowingNotification {
    /**
     * The id of the Notification
     */
    id: number;

    /**
     * The type of notification
     */
    type: "FOLLOWING";

    /**
     * The id of the user who followed the authenticated user
     */
    userId: number;

    /**
     * The notification context text
     */
    context: string;

    /**
     * The time the notification was created at
     */
    createdAt: number;

    /**
     * The liked activity
     */
    user: BasicUser;
}

/**
 * `ActivityMessageNotification` — a direct-message notification; `type` is always "ACTIVITY_MESSAGE".
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface ActivityMessageNotification {
    /**
     * The id of the Notification
     */
    id: number;

    /**
     * The if of the user who send the message
     */
    userId: number;

    /**
     * The type of notification
     */
    type: "ACTIVITY_MESSAGE";

    /**
     * The id of the activity message
     */
    activityId: number;

    /**
     * The notification context text
     */
    context: string;

    /**
     * The time the notification was created at
     */
    createdAt: number;

    /**
     * The message activity
     */
    message: {
        /**
         * The id of the activity
         */
        id: number;

        /**
         * The user id of the activity's recipient
         */
        recipientId: number;

        /**
         * The user id of the activity's sender
         */
        messengerId: number;

        /**
         * The type of the activity
         */
        type: string;

        /**
         * The number of activity replies
         */
        replyCount: number;

        /**
         * The message text (Markdown)
         */
        message: string;

        /**
         * If the activity is locked and can receive replies
         */
        isLocked: boolean;

        /**
         * If the currently authenticated user is subscribed to the activity
         */
        isSubscribed: boolean;

        /**
         * The amount of likes the activity has
         */
        likeCount: number;

        /**
         * If the currently authenticated user liked the activity
         */
        isLiked: boolean;

        /**
         * If the message is private and only viewable to the sender and recipients
         */
        isPrivate: boolean;

        /**
         * The url for the activity page on the AniList website
         */
        siteUrl: string;

        /**
         * The time the activity was created at
         */
        createdAt: number;

        /**
         * The written replies to the activity
         */
        replies: Array<{
            /**
             * The id of the reply
             */
            id: number;

            /**
             * The id of the replies creator
             */
            userId: number;

            /**
             * The id of the parent activity
             */
            activityId: number;

            /**
             * The reply text
             */
            text: string;

            /**
             * The time the reply was created at
             */
            createdAt: number;

            /**
             * The amount of likes the reply has
             */
            likeCount: number;

            /**
             * If the currently authenticated user liked the reply
             */
            isLiked: boolean;

            /**
             * The user who created reply
             */
            user: BasicUser;

            /**
             * The users who liked the reply
             */
            likes: BasicUser[];
        }>;

        /**
         * The users who liked the activity
         */
        likes: BasicUser[];
    };

    /**
     * The user who sent the message
     */
    user: BasicUser;
}

/**
 * `ThreadLikeNotification` — a thread-like notification; `type` is always "THREAD_LIKE".
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface ThreadLikeNotification {
    /**
     * The id of the Notification
     */
    id: number;

    /**
     * The id of the user who liked to the activity
     */
    userId: number;

    /**
     * The type of notification
     */
    type: "THREAD_LIKE";

    /**
     * The notification context text
     */
    context: string;

    /**
     * The time the notification was created at
     */
    createdAt: number;

    /**
     * The thread that the relevant comment belongs to
     */
    thread: BasicThread;

    /**
     * The liked thread comment
     */
    comment: BasicComment;

    /**
     * The user who liked the activity
     */
    user: BasicUser;
}

/**
 * `RelatedMediaAdditionNotification` — a media-added-to-list notification; `type` is always "RELATED_MEDIA_ADDITION".
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface RelatedMediaAdditionNotification {
    /**
     * The id of the Notification
     */
    id: number;

    /**
     * The type of notification
     */
    type: "RELATED_MEDIA_ADDITION";

    /**
     * The id of the new media
     */
    mediaId: number;

    /**
     * The notification context text
     */
    context: string;

    /**
     * The time the notification was created at
     */
    createdAt: number;

    /**
     * The associated media of the airing schedule
     */
    media: {
        /**
         * The id of the media
         */
        id: number;

        /**
         * The official titles of the media in various languages
         */
        title: {
            /**
             * The romanization of the native language title
             */
            romaji: string;

            /**
             * The official english title
             */
            english: string;

            /**
             * Official title in it's native language
             */
            native: string;

            /**
             * The currently authenticated users preferred title language. Default romaji for non-authenticated
             */
            userPreferred: string;
        };
    };
}

/**
 * `MediaDataChangeNotification` — a media data-change notification; `type` is always "MEDIA_DATA_CHANGE".
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface MediaDataChangeNotification {
    /**
     * The id of the Notification
     */
    id: number;

    /**
     * The type of notification
     */
    type: "MEDIA_DATA_CHANGE";

    /**
     * The id of the media that received data changes
     */
    mediaId: number;

    /**
     * The reason for the media data change
     */
    context: string;

    /**
     * The reason for the media data change
     */
    reason: string;

    /**
     * The time the notification was created at
     */
    createdAt: number;

    /**
     * The media that received data changes
     */
    media: {
        /**
         * The id of the media
         */
        id: number;

        /**
         * The official titles of the media in various languages
         */
        title: {
            /**
             * The romanization of the native language title
             */
            romaji: string;

            /**
             * The official english title
             */
            english: string;

            /**
             * Official title in it's native language
             */
            native: string;

            /**
             * The currently authenticated users preferred title language. Default romaji for non-authenticated
             */
            userPreferred: string;
        };
    };
}

/**
 * `MediaMergeNotification` — a media-merge notification; `type` is always "MEDIA_MERGE".
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface MediaMergeNotification {
    /**
     * The id of the Notification
     */
    id: number;

    /**
     * The type of notification
     */
    type: "MEDIA_MERGE";

    /**
     * The id of the media that was merged into
     */
    mediaId: number;

    /**
     * The title of the deleted media
     */
    deletedMediaTitles: string[];

    /**
     * The reason for the media data change
     */
    context: string;

    /**
     * The reason for the media merge
     */
    reason: string;

    /**
     * The time the notification was created at
     */
    createdAt: number;

    /**
     * The media that was merged into
     */
    media: {
        /**
         * The id of the media
         */
        id: number;

        /**
         * The official titles of the media in various languages
         */
        title: {
            /**
             * The romanization of the native language title
             */
            romaji: string;

            /**
             * The official english title
             */
            english: string;

            /**
             * Official title in it's native language
             */
            native: string;

            /**
             * The currently authenticated users preferred title language. Default romaji for non-authenticated
             */
            userPreferred: string;
        };
    };
}

/**
 * `MediaDeletionNotification` — a media-deletion notification; `type` is always "MEDIA_DELETION".
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface MediaDeletionNotification {
    /**
     * The id of the Notification
     */
    id: number;

    /**
     * The type of notification
     */
    type: "MEDIA_DELETION";

    /**
     * The title of the deleted media
     */
    deletedMediaTitle: string;

    /**
     * The reason for the media deletion
     */
    context: string;

    /**
     * The reason for the media deletion
     */
    reason: string;

    /**
     * The time the notification was created at
     */
    createdAt: number;
}

// @generated-end
