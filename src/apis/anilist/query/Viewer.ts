import { APIWrapper } from "../../../base/APIWrapper";
import { type UserResponse } from "../interfaces/responses/query/User";
import { type UserStatisticSort, UserStatisticSortMappings } from "../types/Sort";
import { UserSchema } from "../schemas/responses/query/User";

/**
 * `ViewerVariables` is an interface representing the variables for the `ViewerQuery`.
 * It includes optional parameters for querying viewer data.
 * @see https://docs.anilist.co/reference/query
 */
export interface ViewerVariables {
    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
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
     * `animeStatSort` is an array of strings representing the sort order of the anime statistics.
     */
    animeStatSort?: UserStatisticSort[];

    /**
     * `mangaStatSort` is an array of strings representing the sort order of the manga statistics.
     */
    mangaStatSort?: UserStatisticSort[];
}

/**
 * `ViewerQuery` is a class representing a query for viewer data.
 * It includes a method to send the viewer query and receive the response.
 * @see https://docs.anilist.co/reference/object/user
 */
export class ViewerQuery extends APIWrapper {
    /**
     * `viewer` is a method that sends a query request to get viewer data.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/user
     */
    async viewer(variables: ViewerVariables = {}): Promise<UserResponse> {
        const query = `
      query ($asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Viewer {
          ${UserSchema}
        }
      }
    `;
        return await this.execute<UserResponse>(query, variables, {
            mappings: {
                asHtml: "boolean",
                animeStatLimit: "number",
                mangaStatLimit: "number",
                animeStatSort: UserStatisticSortMappings,
                mangaStatSort: UserStatisticSortMappings,
            },
            requiresAuth: true,
        });
    }
}
