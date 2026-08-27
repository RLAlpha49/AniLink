import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type ReviewsPageResponse } from "../../interfaces/responses/page/Reviews";
import { ReviewSortMappings } from "../../types/Sort";
import { ReviewSchema } from "../../schemas/responses/query/Review";

/**
 * {@link ReviewsVariables} contains variables for the {@link ReviewsQuery} operation.
 *
 * See {@link ReviewsQuery} and {@link ReviewsPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/review
 */
export interface ReviewsVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

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
    mediaType?: string;

    /**
     * `sort` is an array of strings representing the sort order.
     */
    sort?: string[];

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the `reviews` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ReviewsMappings = {
    page: "number",
    perPage: "number",
    id: "number",
    mediaId: "number",
    userId: "number",
    mediaType: "string",
    sort: ReviewSortMappings,
    asHtml: "boolean",
};

/**
 * {@link ReviewsQuery} executes the paginated AniList reviews query through {@link AniListOperation}.
 * Its public operation is {@link ReviewsQuery.reviews}.
 * @see https://docs.anilist.co/reference/object/review
 */
export class ReviewsQuery extends AniListOperation {
    /**
     * `reviews` is a method that sends a query request to get reviews.
     *
     * @param variables - Values from {@link ReviewsVariables} for the query.
     * @returns The {@link ReviewsPageResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/review
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ReviewsQuery().reviews({ mediaId: 1, page: 1 });
     * ```
     */
    async reviews(
        variables: ReviewsVariables,
        options?: RequestOptions
    ): Promise<ReviewsPageResponse> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $mediaId: Int, $userId: Int, $mediaType: MediaType, $sort: [ReviewSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          reviews (id: $id, mediaId: $mediaId, userId: $userId, mediaType: $mediaType, sort: $sort) {
            ${ReviewSchema}
          }
        }
      }
    `;
        return await this.execute<ReviewsPageResponse>(query, variables, {
            mappings: ReviewsMappings,
            transportOptions: options,
        });
    }
}
