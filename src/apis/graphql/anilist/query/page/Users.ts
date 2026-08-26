import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type UsersPageResponse } from "../../interfaces/responses/page/Users";
import { UserSortMappings, UserStatisticSortMappings } from "../../types/Sort";
import { UserSchema } from "../../schemas/responses/query/User";

/**
 * `UsersVariables` is an interface representing the variables for the `UsersQuery`.
 * It includes optional page, per page, id, name, is moderator, search, sort, as html, anime stat limit, manga stat limit, anime stat sort, and manga stat sort.
 * @see https://docs.anilist.co/reference/query
 */
export interface UsersVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

    /**
     * `id` is a number representing the id of the user.
     */
    id?: number;

    /**
     * `name` is a string representing the name of the user.
     */
    name?: string;

    /**
     * `isModerator` is a boolean representing whether the user is a moderator.
     */
    isModerator?: boolean;

    /**
     * `search` is a string representing the search term.
     */
    search?: string;

    /**
     * `sort` is an array of strings representing the sort order.
     */
    sort?: string[];

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
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
    animeStatSort?: string[];

    /**
     * `mangaStatSort` is an array of strings representing the sort order for manga statistics.
     */
    mangaStatSort?: string[];
}

/**
 * The variable type mappings for the `users` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const UsersMappings = {
    page: "number",
    perPage: "number",
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
 * `UsersQuery` is a class representing a query for users.
 * It includes a method to get users.
 * @see https://docs.anilist.co/reference/object/user
 */
export class UsersQuery extends AniListOperation {
    /**
     * `users` is a method that sends a query request to get users.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async users(variables: UsersVariables, options?: RequestOptions): Promise<UsersPageResponse> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $name: String, $isModerator: Boolean, $search: String, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          users (id: $id, name: $name, isModerator: $isModerator, search: $search, sort: $sort) {
            ${UserSchema}
          }
        }
      }
    `;
        return await this.execute<UsersPageResponse>(query, variables, {
            mappings: UsersMappings,
            transportOptions: options,
        });
    }
}
