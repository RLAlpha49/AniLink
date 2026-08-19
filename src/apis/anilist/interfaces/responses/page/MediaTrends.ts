import { type MediaTrendResponse } from "../query/MediaTrend";
import { type PageInfo } from "./PageInfo";

/**
 * `MediaTrendsPageResponse` is the paginated response from a media trends query.
 * @see https://docs.anilist.co/reference/object/mediatrend
 */
export interface MediaTrendsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Media trends returned for the requested page. */
    mediaTrends: MediaTrendResponse[];
}
