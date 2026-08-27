import { type RecommendationResponse } from "../interfaces/responses/query/Recommendation";
import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import {
    type RecommendationRating,
    RecommendationRatingMappings,
} from "../types/RecommendationRating";
import { RecommendationSchema } from "../schemas/responses/query/Recommendation";

/**
 * {@link SaveRecommendationVariables} contains variables for the {@link SaveRecommendationMutation} operation.
 *
 * See the {@link SaveRecommendationMutation} operation and {@link RecommendationResponse} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/recommendation
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
 * Validation metadata maps {@link SaveRecommendationVariables} to runtime types for the
 * `saveRecommendation` operation.
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
 * {@link SaveRecommendationMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link SaveRecommendationMutation.saveRecommendation}; variables use
 * {@link SaveRecommendationVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export class SaveRecommendationMutation extends AniListOperation {
    /**
     * {@link SaveRecommendationMutation.saveRecommendation} sends a mutation request to save a recommendation.
     *
     * @param variables - Values from {@link SaveRecommendationVariables} for the mutation.
     * @returns The {@link RecommendationResponse} returned by the mutation.
     * @throws Throws if no authentication token is configured, `mediaId`, `mediaRecommendationId`, or `rating` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/recommendation
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new SaveRecommendationMutation("your-token").saveRecommendation({ mediaId: 1, mediaRecommendationId: 2, rating: "RATE_UP" });
     * ```
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
