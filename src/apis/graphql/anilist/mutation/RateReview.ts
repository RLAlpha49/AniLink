import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ReviewResponse } from "../interfaces/responses/query/Review";
import { type ReviewRating, ReviewRatingMappings } from "../types/ReviewRating";
import { ReviewSchema } from "../schemas/responses/query/Review";

/**
 * `RateReviewVariables` is an interface representing the variables for the `RateReviewMutation`.
 * It includes the review id and rating to apply to the review.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface RateReviewVariables {
    /**
     * `reviewId` is a number representing the id of the review to rate.
     */
    reviewId: number;

    /**
     * `rating` is a `ReviewRating` representing the vote to apply to the review.
     */
    rating: ReviewRating;
}

/**
 * The variable type mappings for the `rateReview` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const RateReviewMappings = {
    reviewId: "number",
    rating: ReviewRatingMappings,
};

/**
 * `RateReviewMutation` is a class representing a mutation to rate a review.
 * It includes a method to send the rate review mutation and receive the response.
 * @see https://docs.anilist.co/reference/object/review
 */
export class RateReviewMutation extends AniListOperation {
    /**
     * `rateReview` is a method that sends a mutation request to rate a review.
     *
     * @param variables - An object of type `RateReviewVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if authentication is missing, validation fails, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/review
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
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
