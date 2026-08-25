/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type RecommendationResponse } from "../query/Recommendation";
import { type PageInfo } from "./PageInfo";
/**
 * `RecommendationsPageResponse` — a page of media recommendations with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export interface RecommendationsPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `recommendations` is a list of `RecommendationResponse` entries representing the recommendations.
     */
    recommendations: RecommendationResponse[];
}

// @generated-end
