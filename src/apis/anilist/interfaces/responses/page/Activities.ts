import { type Activity } from "../../Activity";
import { type PageInfo } from "./PageInfo";

/**
 * `ActivitiesPageResponse` is the paginated response from an activities query.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export interface ActivitiesPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /**
     * Activities returned for the requested page. Exactly one member shape of
     * the `Activity` union is present per item; narrow on the literal `type`
     * field to access member-specific properties.
     */
    activities: Activity[];
}
