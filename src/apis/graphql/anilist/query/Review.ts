import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ReviewResponse } from "../interfaces/responses/query/Review";
import { type MediaType } from "../types/Type";
import { type ReviewSort, ReviewSortMappings } from "../types/Sort";
import { ReviewSchema } from "../schemas/responses/query/Review";

/**
 * `ReviewVariables` is an interface representing the variables for the `ReviewQuery`.
 * It includes optional parameters for querying review data.
 * @see https://docs.anilist.co/reference/query
 */
export interface ReviewVariables {
    /**
     * `id` is a number representing the id of the review.
     */
    id?: number;

    /**
     * `mediaId` is a number representing the id of the media.
     */
    mediaId?: number;

    /**
     * `userId` is a number representing the id of the user.
     */
    userId?: number;

    /**
     * `mediaType` is a string representing the type of the media.
     */
    mediaType?: MediaType;

    /**
     * `sort` is an array of strings representing the sort order of the review.
     */
    sort?: ReviewSort[];

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * The variable type mappings for the `review` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ReviewMappings = {
    id: "number",
    mediaId: "number",
    userId: "number",
    mediaType: "string",
    sort: ReviewSortMappings,
    asHtml: "boolean",
};

/**
 * `ReviewQuery` is a class representing a query for review data.
 * It includes a method to send the review query and receive the response.
 * @see https://docs.anilist.co/reference/object/review
 */
export class ReviewQuery extends AniListOperation {
    /**
     * `review` is a method that sends a query request to get review data.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/review
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async review(variables: ReviewVariables, options?: RequestOptions): Promise<ReviewResponse> {
        const query = `
      query ($id: Int, $mediaId: Int, $userId: Int, $mediaType: MediaType, $sort: [ReviewSort], $asHtml: Boolean) {
        Review (id: $id, mediaId: $mediaId, userId: $userId, mediaType: $mediaType, sort: $sort) {
          ${ReviewSchema}
        }
      }
    `;
        return await this.execute<ReviewResponse>(query, variables, {
            requirements: [
                {
                    kind: "notOnly",
                    names: ["asHtml"],
                    message: "The Review query requires at least one filter variable.",
                },
            ],
            mappings: ReviewMappings,
            transportOptions: options,
        });
    }
}
