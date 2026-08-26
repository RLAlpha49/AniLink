/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type BasicUser } from "../../Basic";
import { type ThreadResponse } from "./Thread";
/**
 * `ThreadCommentResponse` — a forum-thread comment with its thread, author, and nested replies.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export interface ThreadCommentResponse {
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
    thread: ThreadResponse;

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
