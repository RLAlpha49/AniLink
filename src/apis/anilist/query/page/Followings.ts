import { APIWrapper } from "../../APIWrapper";
import type { RequestOptions } from "../../../../base/RequestHandler";

import { type FollowingsPageResponse } from "../../interfaces/responses/page/Followings";
import { UserSortMappings, UserStatisticSortMappings } from "../../types/Sort";
import { UserSchema } from "../../schemas/responses/query/User";

/**
 * `FollowingsVariables` is an interface representing the variables for the `FollowingsQuery`.
 * It includes optional page, per page, user id, sort, anime stat limit, manga stat limit, anime stat sort, and manga stat sort.
 * @see https://docs.anilist.co/reference/query
 */
export interface FollowingsVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

    /**
     * `userId` is a number representing the id of the user.
     */
    userId: number;

    /**
     * `asHtml` is a boolean representing whether the response text is returned as HTML.
     */
    asHtml?: boolean;

    /**
     * `sort` is a string representing the sort order.
     */
    sort?: string;

    /**
     * `animeStatLimit` is a number representing the limit for anime statistics.
     */
    animeStatLimit?: number;

    /**
     * `mangaStatLimit` is a number representing the limit for manga statistics.
     */
    mangaStatLimit?: number;

    /**
     * `animeStatSort` is an array of strings representing the sort order for anime statistics.
     */
    animeStatSort?: string[];

    /**
     * `mangaStatSort` is an array of strings representing the sort order for manga statistics.
     */
    mangaStatSort?: string[];
}

/**
 * The variable type mappings for the `followings` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const FollowingsMappings = {
    page: "number",
    perPage: "number",
    userId: "number",
    sort: UserSortMappings,
    asHtml: "boolean",
    animeStatLimit: "number",
    mangaStatLimit: "number",
    animeStatSort: UserStatisticSortMappings,
    mangaStatSort: UserStatisticSortMappings,
};

/**
 * `FollowingsQuery` is a class representing a query for followings.
 * It includes a method to get followings.
 * @see https://docs.anilist.co/reference/object/user
 */
export class FollowingsQuery extends APIWrapper {
    /**
     * `followings` is a method that sends a query request to get followings.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async followings(
        variables: FollowingsVariables,
        options?: RequestOptions
    ): Promise<FollowingsPageResponse> {
        const query = `
      query ($page: Int, $perPage: Int, $userId: Int!, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          following (userId: $userId, sort: $sort) {
            ${UserSchema}
          }
        }
      }
    `;
        return await this.execute<FollowingsPageResponse>(query, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["userId"],
                    message: "The Page.following query requires a userId.",
                },
            ],
            mappings: FollowingsMappings,
            transportOptions: options,
        });
    }
}
