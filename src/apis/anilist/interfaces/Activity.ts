/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type BasicUser } from "./Basic";
/**
 * `ActivityReply` — a reply to an activity.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export interface ActivityReply {
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
     * The amount of likes the reply has
     */
    likeCount: number;

    /**
     * If the currently authenticated user liked the reply
     */
    isLiked: boolean;

    /**
     * The time the reply was created at
     */
    createdAt: number;

    /**
     * The user who created reply
     */
    user: BasicUser;

    /**
     * The users who liked the reply
     */
    likes: BasicUser[];
}

/**
 * `TextActivity` — a text status activity of a user.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/textactivity
 */
export interface TextActivity {
    /**
     * The id of the activity
     */
    id: number;

    /**
     * The user id of the activity's creator
     */
    userId: number;

    /**
     * The type of activity
     */
    type: "TEXT";

    /**
     * The number of activity replies
     */
    replyCount: number;

    /**
     * The status text (Markdown)
     */
    text: string;

    /**
     * The url for the activity page on the AniList website
     */
    siteUrl: string;

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
     * If the activity is pinned to the top of the users activity feed
     */
    isPinned: boolean;

    /**
     * The time the activity was created at
     */
    createdAt: number;

    /**
     * The user who created the activity
     */
    user: BasicUser;

    /**
     * The written replies to the activity
     */
    replies: ActivityReply[];

    /**
     * The users who liked the activity
     */
    likes: BasicUser[];
}

/**
 * `ListActivity` — a list update activity of a user.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/listactivity
 */
export interface ListActivity {
    /**
     * The id of the activity
     */
    id: number;

    /**
     * The user id of the activity's creator
     */
    userId: number;

    /**
     * The type of activity
     */
    type: "ANIME_LIST" | "MANGA_LIST";

    /**
     * The number of activity replies
     */
    replyCount: number;

    /**
     * The list item's textual status
     */
    status: string;

    /**
     * The list progress made
     */
    progress: string;

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
     * If the activity is pinned to the top of the users activity feed
     */
    isPinned: boolean;

    /**
     * The url for the activity page on the AniList website
     */
    siteUrl: string;

    /**
     * The time the activity was created at
     */
    createdAt: number;

    /**
     * The associated media to the activity update
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
        };
    };

    /**
     * The owner of the activity
     */
    user: BasicUser;

    /**
     * The written replies to the activity
     */
    replies: ActivityReply[];

    /**
     * The users who liked the activity
     */
    likes: BasicUser[];
}

/**
 * `MessageActivity` — a direct message activity between two users.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/messageactivity
 */
export interface MessageActivity {
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
    type: "MESSAGE";

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
     * The user who the activity message was sent to
     */
    recipient: BasicUser;

    /**
     * The user who sent the activity message
     */
    messenger: BasicUser;

    /**
     * The written replies to the activity
     */
    replies: ActivityReply[];

    /**
     * The users who liked the activity
     */
    likes: BasicUser[];
}

/**
 * `Activity` — a single activity returned by the activity query and activity mutations; narrow on the literal `type` field.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export type Activity = TextActivity | ListActivity | MessageActivity;

/**
 * `ActivityNotification` — an activity-related notification; narrow on the literal `type` field.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface ActivityNotification {
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
        | "ACTIVITY_MENTION"
        | "ACTIVITY_REPLY"
        | "ACTIVITY_LIKE"
        | "ACTIVITY_REPLY_LIKE"
        | "ACTIVITY_REPLY_SUBSCRIBED";

    /**
     * The id of the activity where mentioned
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
     * The liked activity
     */
    activity: Activity;

    /**
     * The user who mentioned the authenticated user
     */
    user: BasicUser;
}

// @generated-end
