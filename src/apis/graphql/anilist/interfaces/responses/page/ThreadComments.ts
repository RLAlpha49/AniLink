/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type ThreadCommentResponse } from "../query/ThreadComment";
import { type PageInfo } from "./PageInfo";
/**
 * `ThreadCommentsPageResponse` — a page of thread comments with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export interface ThreadCommentsPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `threadComments` is a list of `ThreadCommentResponse` entries representing the thread comments.
     */
    threadComments: ThreadCommentResponse[];
}

// @generated-end
