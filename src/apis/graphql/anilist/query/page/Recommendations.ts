import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type RecommendationsPageResponse } from "../../interfaces/responses/page/Recommendations";
import { RecommendationSortMappings } from "../../types/Sort";
import { RecommendationSchema } from "../../schemas/responses/query/Recommendation";

/**
 * {@link RecommendationsVariables} contains variables for the {@link RecommendationsQuery} operation.
 *
 * See {@link RecommendationsQuery} and {@link RecommendationsPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export interface RecommendationsVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

    /**
     * `id` is a number representing the id of the recommendation.
     */
    id?: number;

    /**
     * `mediaId` is a number representing the id of the media.
     */
    mediaId?: number;

    /**
     * `mediaRecommendationId` is a number representing the id of the media recommendation.
     */
    mediaRecommendationId?: number;

    /**
     * `userId` is a number representing the id of the user.
     */
    userId?: number;

    /**
     * `rating` is a number representing the rating of the recommendation.
     */
    rating?: number;

    /**
     * `onList` is a boolean representing whether the recommendation is on the list.
     */
    onList?: boolean;

    /**
     * `rating_greater` is a number representing the minimum rating.
     */
    rating_greater?: number;

    /**
     * `rating_lesser` is a number representing the maximum rating.
     */
    rating_lesser?: number;

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
 * Validation metadata maps variables to runtime types for the `recommendations` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const RecommendationsMappings = {
    page: "number",
    perPage: "number",
    id: "number",
    mediaId: "number",
    mediaRecommendationId: "number",
    userId: "number",
    rating: "number",
    onList: "boolean",
    rating_greater: "number",
    rating_lesser: "number",
    sort: RecommendationSortMappings,
    asHtml: "boolean",
};

/**
 * {@link RecommendationsQuery} executes the paginated AniList recommendations query through {@link AniListOperation}.
 * Its public operation is {@link RecommendationsQuery.recommendations}.
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export class RecommendationsQuery extends AniListOperation {
    /**
     * `recommendations` is a method that sends a query request to get recommendations.
     *
     * @param variables - Values from {@link RecommendationsVariables} for the query.
     * @returns The {@link RecommendationsPageResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/recommendation
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new RecommendationsQuery().recommendations({ mediaId: 1, page: 1 });
     * ```
     */
    async recommendations(
        variables: RecommendationsVariables,
        options?: RequestOptions
    ): Promise<RecommendationsPageResponse> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $mediaId: Int, $mediaRecommendationId: Int, $userId: Int, $rating: Int, $onList: Boolean, $rating_greater: Int, $rating_lesser: Int, $sort: [RecommendationSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          recommendations (id: $id, mediaId: $mediaId, mediaRecommendationId: $mediaRecommendationId, userId: $userId, rating: $rating, onList: $onList, rating_greater: $rating_greater, rating_lesser: $rating_lesser, sort: $sort) {
            ${RecommendationSchema}
          }
        }
      }
    `;
        return await this.execute<RecommendationsPageResponse>(query, variables, {
            mappings: RecommendationsMappings,
            transportOptions: options,
        });
    }
}
