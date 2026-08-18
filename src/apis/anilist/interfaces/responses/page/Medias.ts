import { type MediaResponse } from "../query/Media";
import { type PageInfo } from "./PageInfo";

/**
 * `MediasPageResponse` is the paginated response from a medias query.
 */
export interface MediasPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Media entries returned for the requested page. */
    media: MediaResponse[];
}
