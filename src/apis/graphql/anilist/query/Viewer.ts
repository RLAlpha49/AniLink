import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type UserResponse } from "../interfaces/responses/query/User";
import { type UserStatisticSort, UserStatisticSortMappings } from "../types/Sort";
import { UserSchema } from "../schemas/responses/query/User";

/**
 * {@link ViewerVariables} contains variables for the {@link ViewerQuery} operation.
 *
 * See {@link ViewerQuery} and {@link UserResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/user
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
 * Validation metadata maps variables to runtime types for the {@link ViewerQuery.viewer} operation.
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
 * {@link ViewerQuery} executes the authenticated AniList viewer query through {@link AniListOperation}.
 * Its public operation is {@link ViewerQuery.viewer}.
 * @see https://docs.anilist.co/reference/object/user
 */
export class ViewerQuery extends AniListOperation {
    /**
     * {@link ViewerQuery.viewer} sends a query request to get viewer data.
     *
     * @param variables - Optional values from {@link ViewerVariables}; defaults to an empty object.
     * @returns The {@link UserResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ViewerQuery("authToken").viewer({});
     * ```
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
