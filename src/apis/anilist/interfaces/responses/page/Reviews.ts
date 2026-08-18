import { type ReviewResponse } from "../query/Review";
import { type PageInfo } from "./PageInfo";

/**
 * `ReviewsPageResponse` is the paginated response from a reviews query.
 */
export interface ReviewsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Reviews returned for the requested page. */
    reviews: ReviewResponse[];
}
