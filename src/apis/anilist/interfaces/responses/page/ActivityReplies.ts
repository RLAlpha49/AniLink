import { type ActivityReply } from "../../Activity";
import { type PageInfo } from "./PageInfo";

/**
 * `ActivityRepliesPageResponse` is the paginated response from an activity replies query.
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export interface ActivityRepliesPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Activity replies returned for the requested page. */
    activityReplies: ActivityReply[];
}
