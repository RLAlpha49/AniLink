import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ReviewResponse } from "../interfaces/responses/query/Review";
import { type ReviewRating, ReviewRatingMappings } from "../types/ReviewRating";
import { ReviewSchema } from "../schemas/responses/query/Review";

/**
 * {@link RateReviewVariables} contains variables for the {@link RateReviewMutation} operation.
 *
 * See the {@link RateReviewMutation} operation and {@link ReviewResponse} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/review
 */
export interface RateReviewVariables {
    /**
     * `reviewId` is a number representing the id of the review to rate.
     */
    reviewId: number;

    /**
     * `rating` is a {@link ReviewRating} representing the vote to apply to the review.
     */
    rating: ReviewRating;
}

/**
 * Validation metadata maps {@link RateReviewVariables} to runtime types for the
 * `rateReview` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const RateReviewMappings = {
    reviewId: "number",
    rating: ReviewRatingMappings,
};

/**
 * {@link RateReviewMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link RateReviewMutation.rateReview}; variables use
 * {@link RateReviewVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/review
 */
export class RateReviewMutation extends AniListOperation {
    /**
     * {@link RateReviewMutation.rateReview} sends a mutation request to rate a review.
     *
     * @param variables - Values from {@link RateReviewVariables} for the mutation.
     * @returns The {@link ReviewResponse} returned by the mutation.
     * @throws Throws if no authentication token is configured, `reviewId` or `rating` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/review
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new RateReviewMutation("your-token").rateReview({ reviewId: 1, rating: "UP_VOTE" });
     * ```
     */
    async rateReview(
        variables: RateReviewVariables,
        options?: RequestOptions
    ): Promise<ReviewResponse> {
        const mutation = `
      mutation ($reviewId: Int, $rating: ReviewRating) {
        RateReview (reviewId: $reviewId, rating: $rating) {
          ${ReviewSchema}
        }
      }
    `;
        return await this.execute<ReviewResponse>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["reviewId", "rating"],
                    message: "The RateReview mutation requires reviewId and rating variables.",
                },
            ],
            mappings: RateReviewMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
