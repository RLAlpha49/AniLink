import { type StudioResponse } from "../query/Studio";
import { type PageInfo } from "./PageInfo";

/**
 * `StudiosPageResponse` is the paginated response from a studios query.
 * @see https://docs.anilist.co/reference/object/studio
 */
export interface StudiosPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Studios returned for the requested page. */
    studios: StudioResponse[];
}
