import { type ThreadCommentResponse } from "../query/ThreadComment";
import { type PageInfo } from "./PageInfo";

/**
 * `ThreadCommentsPageResponse` is the paginated response from a thread comments query.
 */
export interface ThreadCommentsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Thread comments returned for the requested page. */
    threadComments: ThreadCommentResponse[];
}
