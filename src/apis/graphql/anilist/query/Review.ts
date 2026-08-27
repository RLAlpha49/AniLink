import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ReviewResponse } from "../interfaces/responses/query/Review";
import { type MediaType } from "../types/Type";
import { type ReviewSort, ReviewSortMappings } from "../types/Sort";
import { ReviewSchema } from "../schemas/responses/query/Review";

/**
 * {@link ReviewVariables} contains variables for the {@link ReviewQuery} operation.
 *
 * See {@link ReviewQuery} and {@link ReviewResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/review
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
 * Validation metadata maps variables to runtime types for the {@link ReviewQuery.review} operation.
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
 * {@link ReviewQuery} executes the AniList review query through {@link AniListOperation}.
 * Its public operation is {@link ReviewQuery.review}.
 * @see https://docs.anilist.co/reference/object/review
 */
export class ReviewQuery extends AniListOperation {
    /**
     * {@link ReviewQuery.review} sends a query request to get review data.
     *
     * @param variables - Values from {@link ReviewVariables} for the query.
     * @returns The {@link ReviewResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/review
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ReviewQuery().review({ mediaId: 1 });
     * ```
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
