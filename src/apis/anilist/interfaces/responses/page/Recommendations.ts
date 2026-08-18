import { type RecommendationResponse } from "../query/Recommendation";
import { type PageInfo } from "./PageInfo";

/**
 * `RecommendationsPageResponse` is the paginated response from a recommendations query.
 */
export interface RecommendationsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Recommendations returned for the requested page. */
    recommendations: RecommendationResponse[];
}
