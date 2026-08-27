import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ReviewResponse } from "../interfaces/responses/query/Review";
import { ReviewSchema } from "../schemas/responses/query/Review";

/**
 * {@link SaveReviewVariables} contains variables for the {@link SaveReviewMutation} operation.
 *
 * See the {@link SaveReviewMutation} operation and {@link ReviewResponse} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/review
 */
export interface SaveReviewVariables {
    /**
     * `id` is the ID of the review.
     */
    id: number;

    /**
     * `mediaId` is the ID of the media.
     */
    mediaId: number;

    /**
     * `body` is the body of the review.
     */
    body: string;

    /**
     * `summary` is the summary of the review.
     */
    summary: string;

    /**
     * `score` is the score of the review.
     */
    score: number;

    /**
     * `private` is a boolean that determines if the review is private.
     */
    private: boolean;

    /**
     * `asHtml` is a boolean that determines if the review is in HTML format.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps {@link SaveReviewVariables} to runtime types for the
 * `saveReview` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const SaveReviewMappings = {
    id: "number",
    mediaId: "number",
    body: "string",
    summary: "string",
    score: "number",
    private: "boolean",
    asHtml: "boolean",
};

/**
 * {@link SaveReviewMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link SaveReviewMutation.saveReview}; variables use
 * {@link SaveReviewVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/review
 */
export class SaveReviewMutation extends AniListOperation {
    /**
     * {@link SaveReviewMutation.saveReview} sends a mutation request to save a review.
     *
     * @param variables - Values from {@link SaveReviewVariables} for the mutation.
     * @returns The {@link ReviewResponse} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` or `mediaId` is missing, a variable has an invalid type, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/review
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new SaveReviewMutation("your-token").saveReview({ id: 1, mediaId: 1, body: "Example review", summary: "Example", score: 8, private: false });
     * ```
     */
    async saveReview(
        variables: SaveReviewVariables,
        options?: RequestOptions
    ): Promise<ReviewResponse> {
        const mutation = `
      mutation ($id: Int, $mediaId: Int, $body: String, $summary: String, $score: Int, $private: Boolean, $asHtml: Boolean) {
        SaveReview(id: $id, mediaId: $mediaId, body: $body, summary: $summary, score: $score, private: $private) {
          ${ReviewSchema}
        }
      }
    `;
        return await this.execute<ReviewResponse>(mutation, variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["id", "mediaId"],
                    message: "The SaveReview mutation requires an id or a mediaId variable.",
                },
            ],
            mappings: SaveReviewMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
