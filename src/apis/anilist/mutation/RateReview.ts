import { APIWrapper } from "../../../base/APIWrapper";
import { requireVariables, validateVariables } from "../../../base/ValidateVariables";
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
 * `RateReviewMutation` is a class representing a mutation to rate a review.
 * It includes a method to send the rate review mutation and receive the response.
 * @see https://docs.anilist.co/reference/mutation
 */
export class RateReviewMutation extends APIWrapper {
    /**
     * `rateReview` is a method that sends a mutation request to rate a review.
     *
     * @param variables - An object of type `RateReviewVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if authentication is missing, validation fails, or the mutation request fails.
     * @see https://docs.anilist.co/reference/mutation
     */
    async rateReview(variables: RateReviewVariables): Promise<ReviewResponse> {
        requireVariables(
            variables,
            { kind: "all", names: ["reviewId", "rating"] },
            "The RateReview mutation requires reviewId and rating variables."
        );

        validateVariables(variables, {
            reviewId: "number",
            rating: ReviewRatingMappings,
        });

        const mutation = `
      mutation ($reviewId: Int, $rating: ReviewRating) {
        RateReview (reviewId: $reviewId, rating: $rating) {
          ${ReviewSchema}
        }
      }
    `;

        return await this.request(mutation, variables, true);
    }
}
