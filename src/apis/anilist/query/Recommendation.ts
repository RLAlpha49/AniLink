import { APIWrapper } from "../APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type RecommendationResponse } from "../interfaces/responses/query/Recommendation";
import { type RecommendationSort, RecommendationSortMappings } from "../types/Sort";
import { RecommendationSchema } from "../schemas/responses/query/Recommendation";

/**
 * `RecommendationVariables` is an interface representing the variables for the `RecommendationQuery`.
 * It includes optional parameters for querying recommendation data.
 * @see https://docs.anilist.co/reference/query
 */
export interface RecommendationVariables {
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
     * `onList` is a boolean indicating whether the recommendation is on the list.
     */
    onList?: boolean;

    /**
     * `rating_greater` is a number representing the rating greater than the recommendation.
     */
    rating_greater?: number;

    /**
     * `rating_lesser` is a number representing the rating lesser than the recommendation.
     */
    rating_lesser?: number;

    /**
     * `sort` is an array of strings representing the sort order of the recommendation.
     */
    sort?: RecommendationSort[];

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * The variable type mappings for the `recommendation` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const RecommendationMappings = {
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
 * `RecommendationQuery` is a class representing a query for recommendation data.
 * It includes a method to send the recommendation query and receive the response.
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export class RecommendationQuery extends APIWrapper {
    /**
     * `recommendation` is a method that sends a query request to get recommendation data.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/recommendation
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async recommendation(
        variables: RecommendationVariables,
        options?: RequestOptions
    ): Promise<RecommendationResponse> {
        const query = `
      query ($id: Int, $mediaId: Int, $mediaRecommendationId: Int, $userId: Int, $rating: Int, $onList: Boolean, $rating_greater: Int, $rating_lesser: Int, $sort: [RecommendationSort], $asHtml: Boolean) {
        Recommendation (id: $id, mediaId: $mediaId, mediaRecommendationId: $mediaRecommendationId, userId: $userId, rating: $rating, onList: $onList, rating_greater: $rating_greater, rating_lesser: $rating_lesser, sort: $sort) {
          ${RecommendationSchema}
        }
      }
    `;
        return await this.execute<RecommendationResponse>(query, variables, {
            requirements: [
                {
                    kind: "notOnly",
                    names: ["asHtml"],
                    message: "The Recommendation query requires at least one filter variable.",
                },
            ],
            mappings: RecommendationMappings,
            transportOptions: options,
        });
    }
}
