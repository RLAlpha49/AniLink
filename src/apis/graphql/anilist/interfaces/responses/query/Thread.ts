/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type BasicUser } from "../../Basic";
import { type Media } from "../../Media";
/**
 * `ThreadResponse` — a forum thread with its body, categories, and participants.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/thread
 */
export interface ThreadResponse {
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
     * The id of the thread owner user
     */
    userId: number;

    /**
     * The id of the user who most recently commented on the thread
     */
    replyUserId: number;

    /**
     * The id of the most recent comment on the thread
     */
    replyCommentId: number;

    /**
     * The number of comments on the thread
     */
    replyCount: number;

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
    mediaCategories: Media[];
}

// @generated-end
