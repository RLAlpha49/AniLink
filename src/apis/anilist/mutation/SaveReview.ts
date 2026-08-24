import { APIWrapper } from "../../../base/APIWrapper";
import { type ReviewResponse } from "../interfaces/responses/query/Review";
import { ReviewSchema } from "../schemas/responses/query/Review";

/**
 * `SaveReviewVariables` is an interface that contains the variables that are required to save a review.
 * It includes the review ID, media ID, body, summary, score, and private status.
 * @see https://docs.anilist.co/reference/mutation
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
 * `SaveReviewMutation` is a class representing a mutation to save a review.
 * It includes a method to save a review.
 * @see https://docs.anilist.co/reference/object/review
 */
export class SaveReviewMutation extends APIWrapper {
    /**
     * `saveReview` is a method that sends a mutation request to save a review.
     *
     * @param variables - An object of type `SaveReviewVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/review
     */
    async saveReview(variables: SaveReviewVariables): Promise<ReviewResponse> {
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
            mappings: {
                id: "number",
                mediaId: "number",
                body: "string",
                summary: "string",
                score: "number",
                private: "boolean",
                asHtml: "boolean",
            },
            requiresAuth: true,
        });
    }
}
