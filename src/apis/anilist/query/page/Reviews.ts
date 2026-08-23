import { APIWrapper } from "../../../../base/APIWrapper";

import { type ReviewsPageResponse } from "../../interfaces/responses/page/Reviews";
import { ReviewSortMappings } from "../../types/Sort";
import { validateVariables } from "../../../../base/ValidateVariables";
import { ReviewSchema } from "../../schemas/responses/query/Review";

/**
 * `ReviewsVariables` is an interface representing the variables for the `ReviewsQuery`.
 * It includes optional page, per page, id, media id, user id, media type, sort, and as html.
 * @see https://docs.anilist.co/reference/query
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
 * `ReviewsQuery` is a class representing a query for reviews.
 * It includes a method to get reviews.
 * @see https://docs.anilist.co/reference/object/review
 */
export class ReviewsQuery extends APIWrapper {
    /**
     * `reviews` is a method that sends a query request to get reviews.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/review
     */
    async reviews(variables: ReviewsVariables): Promise<ReviewsPageResponse> {
        const variableTypeMappings = {
            page: "number",
            perPage: "number",
            id: "number",
            mediaId: "number",
            userId: "number",
            mediaType: "string",
            sort: ReviewSortMappings,
            asHtml: "boolean",
        };

        validateVariables(variables, variableTypeMappings);

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

        return await this.request(query, variables);
    }
}
