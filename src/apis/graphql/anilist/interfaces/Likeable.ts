/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/graphql/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type Activity, type ActivityReply } from "./Activity";
import { type BasicUser } from "./Basic";
import { type Thread, type ThreadComment } from "./Thread";
/**
 * `Likeable` — a likeable entity returned by ToggleLikeV2; narrow structurally because only activities carry a `type` discriminator.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/mutation
 */
export type Likeable = Activity | ActivityReply | Thread | ThreadComment;

/**
 * `LikeableThread` — the thread fragment selected by ToggleLikeV2, including its aliased keys.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/thread
 */
export interface LikeableThread {
    /**
     * The id of the thread
     */
    id: number;

    /**
     * The title of the thread
     */
    title: string;

    /**
     * The text body of the thread (Markdown)
     */
    body: string;

    /**
     * `ThreadUserId` is a number value representing the thread user id.
     */
    ThreadUserId: number;

    /**
     * The id of the user who most recently commented on the thread
     */
    replyUserId: number;

    /**
     * The id of the most recent comment on the thread
     */
    replyCommentId: number;

    /**
     * `ThreadReplyCount` is a number value representing the thread reply count.
     */
    ThreadReplyCount: number;

    /**
     * The number of times users have viewed the thread
     */
    viewCount: number;

    /**
     * If the thread is locked and can receive comments
     */
    isLocked: boolean;

    /**
     * If the thread is stickied and should be displayed at the top of the page
     */
    isSticky: boolean;

    /**
     * If the currently authenticated user is subscribed to the thread
     */
    isSubscribed: boolean;

    /**
     * The amount of likes the thread has
     */
    likeCount: number;

    /**
     * If the currently authenticated user liked the thread
     */
    isLiked: boolean;

    /**
     * The time of the last reply
     */
    repliedAt: number;

    /**
     * The time of the thread creation
     */
    createdAt: number;

    /**
     * The time of the thread last update
     */
    updatedAt: number;

    /**
     * The owner of the thread
     */
    user: BasicUser;

    /**
     * The user to last reply to the thread
     */
    replyUser: BasicUser;

    /**
     * The users who liked the thread
     */
    likes: BasicUser[];

    /**
     * The url for the thread page on the AniList website
     */
    siteUrl: string;

    /**
     * The categories of the thread
     */
    categories: Array<{
        /**
         * The id of the category
         */
        id: number;

        /**
         * The name of the category
         */
        name: string;
    }>;

    /**
     * The media categories of the thread
     */
    mediaCategories: Array<{
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
    }>;
}

/**
 * `LikeableThreadComment` — the thread-comment fragment selected by ToggleLikeV2 with its minimal parent thread.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export interface LikeableThreadComment {
    /**
     * The id of the comment
     */
    id: number;

    /**
     * The user id of the comment's owner
     */
    userId: number;

    /**
     * The id of thread the comment belongs to
     */
    threadId: number;

    /**
     * The text content of the comment (Markdown)
     */
    comment: string;

    /**
     * The amount of likes the comment has
     */
    likeCount: number;

    /**
     * If the currently authenticated user liked the comment
     */
    isLiked: boolean;

    /**
     * The url for the comment page on the AniList website
     */
    siteUrl: string;

    /**
     * The time of the comments creation
     */
    createdAt: number;

    /**
     * The time of the comments last update
     */
    updatedAt: number;

    /**
     * The thread the comment belongs to
     */
    thread: {
        /**
         * The id of the thread
         */
        id: number;

        /**
         * The title of the thread
         */
        title: string;
    };

    /**
     * The user who created the comment
     */
    user: BasicUser;

    /**
     * The users who liked the comment
     */
    likes: BasicUser[];

    /**
     * The comment's child reply comments
     */
    childComments: unknown;

    /**
     * If the comment tree is locked and may not receive replies or edits
     */
    isLocked: boolean;
}

// @generated-end
