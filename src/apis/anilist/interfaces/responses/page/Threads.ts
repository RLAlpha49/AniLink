import { type ThreadResponse } from "../query/Thread";
import { type PageInfo } from "./PageInfo";

/**
 * `ThreadsPageResponse` is the paginated response from a threads query.
 */
export interface ThreadsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Threads returned for the requested page. */
    threads: ThreadResponse[];
}
