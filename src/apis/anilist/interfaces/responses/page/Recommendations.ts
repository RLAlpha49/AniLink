import { type RecommendationResponse } from "../query/Recommendation";
import { type PageInfo } from "./PageInfo";

/**
 * `RecommendationsPageResponse` is the paginated response from a recommendations query.
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export interface RecommendationsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Recommendations returned for the requested page. */
    recommendations: RecommendationResponse[];
}
