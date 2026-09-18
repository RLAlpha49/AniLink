import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type UsersPageResponse } from "../../interfaces/responses/page/Users";
import { UserSortMappings, UserStatisticSortMappings } from "../../types/Sort";
import { UserSchema } from "../../schemas/responses/query/User";
import { composeDocument } from "../../schemas/selection/composeSelection";
import { PAGE_ALWAYS, splitFieldsOption } from "../../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../../schemas/selection/fieldsSelection";

/**
 * {@link UsersVariables} contains variables for the {@link UsersQuery} operation.
 *
 * See {@link UsersQuery} and {@link UsersPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/user
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
     * `sort` is an array of strings representing the sort order; `UserSort` values.
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
     * `animeStatSort` is an array of strings representing the sort order for anime statistics; `UserStatisticSort` values.
     */
    animeStatSort?: string[];

    /**
     * `mangaStatSort` is an array of strings representing the sort order for manga statistics; `UserStatisticSort` values.
     */
    mangaStatSort?: string[];
}

/**
 * Validation metadata maps variables to runtime types for the `users` operation.
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
 * {@link UsersQuery} executes the paginated AniList users query through {@link AniListOperation}.
 * Its public operation is {@link UsersQuery.users}.
 * @see https://docs.anilist.co/reference/object/user
 */
export class UsersQuery extends AniListOperation {
    /**
     * {@link UsersQuery.users} sends a query request to get a page of users.
     *
     * @param variables - Values from {@link UsersVariables} for the query; `page` and `perPage` select the
     * slice of results.
     * @returns The {@link UsersPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<UsersPageResponse, K | "pageInfo">`:
     * the always-selected `pageInfo` is part of the narrowed type because the composed document always sends
     * it. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new UsersQuery().users({ search: "AniList", page: 1 });
     * ```
     */
    async users(
        variables: UsersVariables,
        options?: RequestOptions & { fields?: undefined }
    ): Promise<UsersPageResponse>;
    async users(
        variables: UsersVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<UsersPageResponse>;
    async users<K extends FieldPath<UsersPageResponse>>(
        variables: UsersVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<UsersPageResponse, K | "pageInfo">>;
    async users(
        variables: UsersVariables,
        options?: RequestOptions & FieldsSelection<UsersPageResponse>
    ): FieldsResult<UsersPageResponse, "pageInfo"> {
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
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<UsersPageResponse>(
            composeDocument(query, fields, PAGE_ALWAYS),
            variables,
            {
                mappings: UsersMappings,
                transportOptions,
            }
        );
    }
}
