import { type RecommendationResponse } from "../interfaces/responses/query/Recommendation";
import { APIWrapper } from "../APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import {
    type RecommendationRating,
    RecommendationRatingMappings,
} from "../types/RecommendationRating";
import { RecommendationSchema } from "../schemas/responses/query/Recommendation";

/**
 * `SaveRecommendationVariables` is an interface that contains the variables that are required to save a recommendation.
 * It includes the media ID, media recommendation ID, and rating.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface SaveRecommendationVariables {
    /**
     * `mediaId` is the ID of the media.
     */
    mediaId: number;

    /**
     * `mediaRecommendationId` is the ID of the media recommendation.
     */
    mediaRecommendationId: number;

    /**
     * `rating` is the rating of the recommendation.
     */
    rating: RecommendationRating;

    /**
     * `asHtml` is a boolean that determines if the review is in HTML format.
     */
    asHtml?: boolean;
}

/**
 * The variable type mappings for the `saveRecommendation` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const SaveRecommendationMappings = {
    mediaId: "number",
    mediaRecommendationId: "number",
    rating: RecommendationRatingMappings,
    asHtml: "boolean",
};

/**
 * `SaveRecommendationMutation` is a class representing a mutation to save a recommendation.
 * It includes a method to save a recommendation.
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export class SaveRecommendationMutation extends APIWrapper {
    /**
     * `saveReview` is a method that sends a mutation request to save a recommendation.
     *
     * @param variables - An object of type `SaveRecommendationVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/recommendation
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async saveRecommendation(
        variables: SaveRecommendationVariables,
        options?: RequestOptions
    ): Promise<RecommendationResponse> {
        const mutation = `
      mutation ($mediaId: Int, $mediaRecommendationId: Int, $rating: RecommendationRating, $asHtml: Boolean) {
        SaveRecommendation(mediaId: $mediaId, mediaRecommendationId: $mediaRecommendationId, rating: $rating) {
          ${RecommendationSchema}
        }
      }
    `;
        return await this.execute<RecommendationResponse>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["mediaId", "mediaRecommendationId", "rating"],
                    message:
                        "The SaveRecommendation mutation requires mediaId, mediaRecommendationId, and rating variables.",
                },
            ],
            mappings: SaveRecommendationMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
