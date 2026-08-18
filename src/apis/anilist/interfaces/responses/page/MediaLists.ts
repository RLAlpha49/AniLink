import { type MediaListResponse } from "../query/MediaList";
import { type PageInfo } from "./PageInfo";

/**
 * `MediaListsPageResponse` is the paginated response from a media lists query.
 */
export interface MediaListsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Media list entries returned for the requested page. */
    mediaList: MediaListResponse[];
}
