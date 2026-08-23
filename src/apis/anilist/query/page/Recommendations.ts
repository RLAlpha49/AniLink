import { APIWrapper } from "../../../../base/APIWrapper";

import { type RecommendationsPageResponse } from "../../interfaces/responses/page/Recommendations";
import { RecommendationSortMappings } from "../../types/Sort";
import { validateVariables } from "../../../../base/ValidateVariables";
import { RecommendationSchema } from "../../schemas/responses/query/Recommendation";

/**
 * `RecommendationsVariables` is an interface representing the variables for the `RecommendationsQuery`.
 * It includes optional page, per page, id, media id, media recommendation id, user id, rating, on list, rating greater, rating lesser, sort, and as html.
 * @see https://docs.anilist.co/reference/query
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
 * `RecommendationsQuery` is a class representing a query for recommendations.
 * It includes a method to get recommendations.
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export class RecommendationsQuery extends APIWrapper {
    /**
     * `recommendations` is a method that sends a query request to get recommendations.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/recommendation
     */
    async recommendations(
        variables: RecommendationsVariables
    ): Promise<RecommendationsPageResponse> {
        const variableTypeMappings = {
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

        validateVariables(variables, variableTypeMappings);

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

        return await this.request(query, variables);
    }
}
