import { type ThreadCommentResponse } from "../query/ThreadComment";
import { type PageInfo } from "./PageInfo";

/**
 * `ThreadCommentsPageResponse` is the paginated response from a thread comments query.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export interface ThreadCommentsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Thread comments returned for the requested page. */
    threadComments: ThreadCommentResponse[];
}
