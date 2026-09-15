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
import { composeDocument } from "../schemas/selection/composeSelection";
import { splitFieldsOption } from "../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../schemas/selection/fieldsSelection";

/**
 * Keys selected in every composed user document.
 *
 * `id` is always selected: the handle callers need to follow up with any other call.
 */
export const USER_ALWAYS: readonly string[] = ["id"];

/**
 * {@link UserVariables} contains variables for the {@link UserQuery} operation.
 *
 * See {@link UserQuery} and {@link UserResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/user
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
     * `sort` is an array of {@link UserSort} values representing the sort order of the user.
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
     * `animeStatSort` is an array of {@link UserStatisticSort} values representing the sort order of the anime statistics.
     */
    animeStatSort?: UserStatisticSort[];

    /**
     * `mangaStatSort` is an array of {@link UserStatisticSort} values representing the sort order of the manga statistics.
     */
    mangaStatSort?: UserStatisticSort[];
}

/**
 * Validation metadata maps variables to runtime types for the {@link UserQuery.user} operation.
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
 * {@link UserQuery} executes the AniList user query through {@link AniListOperation}.
 * Its public operation is {@link UserQuery.user}.
 * @see https://docs.anilist.co/reference/object/user
 */
export class UserQuery extends AniListOperation {
    /**
     * {@link UserQuery.user} sends a query request to get user data.
     *
     * @param variables - Values from {@link UserVariables} for the query.
     * @returns The {@link UserResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<UserResponse, K | "id">`:
     * the always-selected `id` is part of the narrowed type because the composed document always sends it.
     * Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new UserQuery().user({ id: 1 });
     * ```
     */
    async user(variables: UserVariables, options?: RequestOptions): Promise<UserResponse>;
    async user(
        variables: UserVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<UserResponse>;
    async user<K extends FieldPath<UserResponse>>(
        variables: UserVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<UserResponse, K | "id">>;
    async user(
        variables: UserVariables,
        options?: RequestOptions & FieldsSelection<UserResponse>
    ): FieldsResult<UserResponse, "id"> {
        const query = `
      query ($id: Int, $name: String, $isModerator: Boolean, $search: String, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        User (id: $id, name: $name, isModerator: $isModerator, search: $search, sort: $sort) {
          ${UserSchema}
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<UserResponse>(
            composeDocument(query, fields, USER_ALWAYS),
            variables,
            {
                mappings: UserMappings,
                transportOptions,
            }
        );
    }
}
