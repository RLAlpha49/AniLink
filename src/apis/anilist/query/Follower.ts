import { APIWrapper } from "../../../base/APIWrapper";
import { type UserResponse } from "../interfaces/responses/query/User";
import {
    type UserSort,
    UserSortMappings,
    type UserStatisticSort,
    UserStatisticSortMappings,
} from "../types/Sort";
import { UserSchema } from "../schemas/responses/query/User";

/**
 * `FollowerVariables` is an interface representing the variables for the `FollowerQuery`.
 * It includes optional userId, sort, asHtml, animeStatLimit, mangaStatLimit, animeStatSort, and mangaStatSort.
 * @see https://docs.anilist.co/reference/query
 */
export interface FollowerVariables {
    /**
     * `userId` is a number representing the id of the user.
     */
    userId: number;

    /**
     * `sort` is a string representing the sort order.
     */
    sort?: UserSort;

    /**
     * `asHtml` is a boolean representing whether the response text is returned as HTML.
     */
    asHtml?: boolean;

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
    animeStatSort?: UserStatisticSort[];

    /**
     * `mangaStatSort` is an array of strings representing the sort order for manga statistics.
     */
    mangaStatSort?: UserStatisticSort[];
}

/**
 * `FollowerQuery` is a class representing a query for followers.
 * It includes a method to get followers.
 * @see https://docs.anilist.co/reference/object/user
 */
export class FollowerQuery extends APIWrapper {
    /**
     * `follower` is a method that sends a query request to get followers.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/user
     */
    async follower(variables: FollowerVariables): Promise<UserResponse> {
        const query = `
      query ($userId: Int!, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Follower (userId: $userId, sort: $sort) {
          ${UserSchema}
        }
      }
    `;
        return await this.execute<UserResponse>(query, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["userId"],
                    message: "The Follower query requires a userId.",
                },
            ],
            mappings: {
                userId: "number",
                sort: UserSortMappings,
                asHtml: "boolean",
                animeStatLimit: "number",
                mangaStatLimit: "number",
                animeStatSort: UserStatisticSortMappings,
                mangaStatSort: UserStatisticSortMappings,
            },
        });
    }
}
