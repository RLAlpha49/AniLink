import { APIWrapper } from "../APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
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
 * The variable type mappings for the `viewer` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ViewerMappings = {
    asHtml: "boolean",
    animeStatLimit: "number",
    mangaStatLimit: "number",
    animeStatSort: UserStatisticSortMappings,
    mangaStatSort: UserStatisticSortMappings,
};

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
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async viewer(variables: ViewerVariables = {}, options?: RequestOptions): Promise<UserResponse> {
        const query = `
      query ($asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Viewer {
          ${UserSchema}
        }
      }
    `;
        return await this.execute<UserResponse>(query, variables, {
            mappings: ViewerMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
