import { type BasicUser } from "./Basic";

/**
 * `ActivityReply` is an interface representing a reply to an activity.
 * It includes the id of the reply, the user id, the activity id, the text of the reply, the like count, the like status, the creation date, the user details, and the likes details.
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export interface ActivityReply {
    /**
     * `id` is a number representing the unique identifier of the reply.
     */
    id: number;

    /**
     * `userId` is a number representing the unique identifier of the user who made the reply.
     */
    userId: number;

    /**
     * `activityId` is a number representing the unique identifier of the activity to which the reply was made.
     */
    activityId: number;

    /**
     * `text` is a string representing the text of the reply.
     */
    text: string;

    /**
     * `likeCount` is a number representing the count of likes the reply has received.
     */
    likeCount: number;

    /**
     * `isLiked` is a boolean representing whether the reply is liked by the user or not.
     */
    isLiked: boolean;

    /**
     * `createdAt` is a number representing the Unix timestamp when the reply was created.
     */
    createdAt: number;

    /**
     * `user` is an object of type `BasicUser` representing the details of the user who made the reply.
     */
    user: BasicUser;

    /**
     * `likes` is an array of `BasicUser` objects representing the details of the users who liked the reply.
     */
    likes: BasicUser[];
}

/**
 * `TextActivity` is an interface representing a text activity.
 * It includes the id, user id, type, reply count, text, site url, lock status, subscription status, like count, like status, pin status, creation date, user details, replies, and likes.
 * @see https://docs.anilist.co/reference/object/textactivity
 */
export interface TextActivity {
    /**
     * `id` is a number representing the unique identifier of the text activity.
     */
    id: number;

    /**
     * `userId` is a number representing the unique identifier of the user who made the text activity.
     */
    userId: number;

    /**
     * `type` is the activity type discriminator of the text activity.
     * It is always "TEXT", which lets `Activity` work as a discriminated union.
     */
    type: "TEXT";

    /**
     * `replyCount` is a number representing the count of replies the text activity has received.
     */
    replyCount: number;

    /**
     * `text` is a string representing the text of the text activity.
     */
    text: string;

    /**
     * `siteUrl` is a string representing the URL of the site where the text activity is posted.
     */
    siteUrl: string;

    /**
     * `isLocked` is a boolean representing whether the text activity is locked or not.
     */
    isLocked: boolean;

    /**
     * `isSubscribed` is a boolean representing whether the user is subscribed to the text activity or not.
     */
    isSubscribed: boolean;

    /**
     * `likeCount` is a number representing the count of likes the text activity has received.
     */
    likeCount: number;

    /**
     * `isLiked` is a boolean representing whether the text activity is liked by the user or not.
     */
    isLiked: boolean;

    /**
     * `isPinned` is a boolean representing whether the text activity is pinned or not.
     */
    isPinned: boolean;

    /**
     * `createdAt` is a number representing the Unix timestamp when the text activity was created.
     */
    createdAt: number;

    /**
     * `user` is an object of type `BasicUser` representing the details of the user who made the text activity.
     */
    user: BasicUser;

    /**
     * `replies` is an array of `ActivityReply` objects representing the replies to the text activity.
     */
    replies: ActivityReply[];

    /**
     * `likes` is an array of `BasicUser` objects representing the users who liked the text activity.
     */
    likes: BasicUser[];
}

/**
 * `ListActivity` is an interface representing a list activity.
 * It includes the id, user id, type, reply count, status, progress, lock status, subscription status, like count, like status, pin status, site url, creation date, media details, user details, replies, and likes.
 * @see https://docs.anilist.co/reference/object/listactivity
 */
export interface ListActivity {
    /**
     * `id` is a number representing the unique identifier of the list activity.
     */
    id: number;

    /**
     * `userId` is a number representing the unique identifier of the user who made the list activity.
     */
    userId: number;

    /**
     * `type` is the activity type discriminator of the list activity.
     * It is "ANIME_LIST" for anime list activities and "MANGA_LIST" for manga list activities,
     * which lets `Activity` work as a discriminated union.
     */
    type: "ANIME_LIST" | "MANGA_LIST";

    /**
     * `replyCount` is a number representing the count of replies the list activity has received.
     */
    replyCount: number;

    /**
     * `status` is a string representing the status of the list activity.
     */
    status: string;

    /**
     * `progress` is a number representing the progress of the list activity.
     */
    progress: number;

    /**
     * `isLocked` is a boolean representing whether the list activity is locked or not.
     */
    isLocked: boolean;

    /**
     * `isSubscribed` is a boolean representing whether the user is subscribed to the list activity or not.
     */
    isSubscribed: boolean;

    /**
     * `likeCount` is a number representing the count of likes the list activity has received.
     */
    likeCount: number;

    /**
     * `isLiked` is a boolean representing whether the list activity is liked by the user or not.
     */
    isLiked: boolean;

    /**
     * `isPinned` is a boolean representing whether the list activity is pinned or not.
     */
    isPinned: boolean;

    /**
     * `siteUrl` is a string representing the URL of the site where the list activity is posted.
     */
    siteUrl: string;

    /**
     * `createdAt` is a number representing the Unix timestamp when the list activity was created.
     */
    createdAt: number;

    /**
     * `media` is an object representing the media details of the list activity.
     * It includes the id and the title of the media.
     */
    media: {
        /**
         * `id` is a number representing the unique identifier of the media.
         */
        id: number;

        /**
         * `title` is an object representing the title of the media.
         * It includes the romaji and english title of the media.
         */
        title: {
            /**
             * `romaji` is a string representing the romaji title of the media.
             */
            romaji: string;

            /**
             * `english` is a string representing the english title of the media.
             */
            english: string;
        };
    };

    /**
     * `user` is an object of type `BasicUser` representing the details of the user who made the list activity.
     */
    user: BasicUser;

    /**
     * `replies` is an array of `ActivityReply` objects representing the replies to the list activity.
     */
    replies: ActivityReply[];

    /**
     * `likes` is an array of `BasicUser` objects representing the users who liked the list activity.
     */
    likes: BasicUser[];
}

/**
 * `MessageActivity` is an interface representing a message activity.
 * It includes the id, recipient id, messenger id, type, reply count, message, lock status, subscription status, like count, like status, privacy status, site url, creation date, recipient details, messenger details, replies, and likes.
 * @see https://docs.anilist.co/reference/object/messageactivity
 */
export interface MessageActivity {
    /**
     * `id` is a number representing the unique identifier of the message activity.
     */
    id: number;

    /**
     * `recipientId` is a number representing the unique identifier of the recipient of the message activity.
     */
    recipientId: number;

    /**
     * `messengerId` is a number representing the unique identifier of the messenger of the message activity.
     */
    messengerId: number;

    /**
     * `type` is the activity type discriminator of the message activity.
     * It is always "MESSAGE", which lets `Activity` work as a discriminated union.
     */
    type: "MESSAGE";

    /**
     * `replyCount` is a number representing the count of replies the message activity has received.
     */
    replyCount: number;

    /**
     * `message` is a string representing the message of the message activity.
     */
    message: string;

    /**
     * `isLocked` is a boolean representing whether the message activity is locked or not.
     */
    isLocked: boolean;

    /**
     * `isSubscribed` is a boolean representing whether the user is subscribed to the message activity or not.
     */
    isSubscribed: boolean;

    /**
     * `likeCount` is a number representing the count of likes the message activity has received.
     */
    likeCount: number;

    /**
     * `isLiked` is a boolean representing whether the message activity is liked by the user or not.
     */
    isLiked: boolean;

    /**
     * `isPrivate` is a boolean representing whether the message activity is private or not.
     */
    isPrivate: boolean;

    /**
     * `siteUrl` is a string representing the URL of the site where the message activity is posted.
     */
    siteUrl: string;

    /**
     * `createdAt` is a number representing the Unix timestamp when the message activity was created.
     */
    createdAt: number;

    /**
     * `recipient` is an object of type `BasicUser` representing the details of the recipient of the message activity.
     */
    recipient: BasicUser;

    /**
     * `messenger` is an object of type `BasicUser` representing the details of the messenger of the message activity.
     */
    messenger: BasicUser;

    /**
     * `replies` is an array of `ActivityReply` objects representing the replies to the message activity.
     */
    replies: ActivityReply[];

    /**
     * `likes` is an array of `BasicUser` objects representing the users who liked the message activity.
     */
    likes: BasicUser[];
}

/**
 * `Activity` is a discriminated union representing a single activity returned by the activity query
 * and the activity-related mutations. The GraphQL selection sets flatten the `ActivityUnion` with
 * one `...on X` fragment per member, so exactly one member shape is present at runtime; narrow on
 * the literal `type` field to access member-specific properties.
 *
 * For the broader likeable-entity payload returned by `ToggleLikeV2` (which additionally selects
 * `ActivityReply`, `Thread`, and `ThreadComment` fragments), see the `Likeable` union.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export type Activity = TextActivity | ListActivity | MessageActivity;

/**
 * `ActivityHistory` is an interface representing the history of an activity.
 * It includes the date of the activity, the amount of the activity, and the level of the activity.
 * @see https://docs.anilist.co/reference/object/useractivityhistory
 */
export interface ActivityHistory {
    /**
     * `date` is a number representing the date of the activity.
     * It is expressed as a Unix timestamp.
     */
    date: number;

    /**
     * `amount` is a number representing the amount of the activity.
     * The exact meaning of this property depends on the context in which the `ActivityHistory` interface is used.
     */
    amount: number;

    /**
     * `level` is a number representing the level of the activity.
     * The exact meaning of this property depends on the context in which the `ActivityHistory` interface is used.
     */
    level: number;
}

/**
 * `ActivityNotification` is an interface representing a notification related to an activity.
 * It includes the id of the notification, the user id, the type of the notification, the activity id, the context, the creation date, the activity details, and the user details.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface ActivityNotification {
    /**
     * `id` is a number representing the unique identifier of the notification.
     */
    id: number;

    /**
     * `userId` is a number representing the unique identifier of the user associated with the notification.
     */
    userId: number;

    /**
     * `type` is the notification type discriminator of the activity notification.
     * It is one of "ACTIVITY_MENTION", "ACTIVITY_REPLY", "ACTIVITY_LIKE", "ACTIVITY_REPLY_LIKE",
     * or "ACTIVITY_REPLY_SUBSCRIBED", which lets `NotificationResponse` work as a discriminated union.
     */
    type:
        | "ACTIVITY_MENTION"
        | "ACTIVITY_REPLY"
        | "ACTIVITY_LIKE"
        | "ACTIVITY_REPLY_LIKE"
        | "ACTIVITY_REPLY_SUBSCRIBED";

    /**
     * `activityId` is a number representing the unique identifier of the activity associated with the notification.
     */
    activityId: number;

    /**
     * `context` is a string representing the context of the notification.
     */
    context: string;

    /**
     * `createdAt` is a number representing the Unix timestamp when the notification was created.
     */
    createdAt: number;

    /**
     * `activity` is an object of type `Activity` representing the details of the activity associated with the notification.
     */
    activity: Activity;

    /**
     * `user` is an object of type `BasicUser` representing the details of the user associated with the notification.
     */
    user: BasicUser;
}
