/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type ReviewResponse } from "../query/Review";
import { type PageInfo } from "./PageInfo";
/**
 * `ReviewsPageResponse` — a page of media reviews with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/review
 */
export interface ReviewsPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `reviews` is a list of `ReviewResponse` entries representing the reviews.
     */
    reviews: ReviewResponse[];
}

// @generated-end
