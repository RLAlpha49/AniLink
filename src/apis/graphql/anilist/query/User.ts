import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type UserResponse } from "../interfaces/responses/query/User";
import {
    type UserSort,
    UserSortMappings,
    type UserStatisticSort,
    UserStatisticSortMappings,
} from "../types/Sort";
import { UserSchema } from "../schemas/responses/query/User";

/**
 * `UserVariables` is an interface representing the variables for the `UserQuery`.
 * It includes optional parameters for querying user data.
 * @see https://docs.anilist.co/reference/query
 */
export interface UserVariables {
    /**
     * `id` is a number representing the id of the user.
     */
    id?: number;

    /**
     * `name` is a string representing the name of the user.
     */
    name?: string;

    /**
     * `isModerator` is a boolean indicating whether the user is a moderator.
     */
    isModerator?: boolean;

    /**
     * `search` is a string representing the search term.
     */
    search?: string;

    /**
     * `sort` is an array of strings representing the sort order of the user.
     */
    sort?: UserSort[];

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
 * The variable type mappings for the `user` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const UserMappings = {
    id: "number",
    name: "string",
    isModerator: "boolean",
    search: "string",
    sort: UserSortMappings,
    asHtml: "boolean",
    animeStatLimit: "number",
    mangaStatLimit: "number",
    animeStatSort: UserStatisticSortMappings,
    mangaStatSort: UserStatisticSortMappings,
};

/**
 * `UserQuery` is a class representing a query for user data.
 * It includes a method to send the user query and receive the response.
 * @see https://docs.anilist.co/reference/object/user
 */
export class UserQuery extends AniListOperation {
    /**
     * `user` is a method that sends a query request to get user data.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async user(variables: UserVariables, options?: RequestOptions): Promise<UserResponse> {
        const query = `
      query ($id: Int, $name: String, $isModerator: Boolean, $search: String, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        User (id: $id, name: $name, isModerator: $isModerator, search: $search, sort: $sort) {
          ${UserSchema}
        }
      }
    `;
        return await this.execute<UserResponse>(query, variables, {
            mappings: UserMappings,
            transportOptions: options,
        });
    }
}
