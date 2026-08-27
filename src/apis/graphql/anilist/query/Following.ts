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
 * {@link FollowingVariables} contains variables for the {@link FollowingQuery} operation.
 *
 * See {@link FollowingQuery} and {@link UserResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/user
 */
export interface FollowingVariables {
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
 * The variable type mappings for the {@link FollowingQuery.following} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const FollowingMappings = {
    userId: "number",
    sort: UserSortMappings,
    asHtml: "boolean",
    animeStatLimit: "number",
    mangaStatLimit: "number",
    animeStatSort: UserStatisticSortMappings,
    mangaStatSort: UserStatisticSortMappings,
};

/**
 * {@link FollowingQuery} executes the AniList following-users query through {@link AniListOperation}.
 * Its public operation is {@link FollowingQuery.following}.
 * @see https://docs.anilist.co/reference/object/user
 */
export class FollowingQuery extends AniListOperation {
    /**
     * {@link FollowingQuery.following} sends a query request to get following users.
     *
     * @param variables - Values from {@link FollowingVariables} for the query.
     * @returns The {@link UserResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new FollowingQuery().following({ userId: 1 });
     * ```
     */
    async following(
        variables: FollowingVariables,
        options?: RequestOptions
    ): Promise<UserResponse> {
        const query = `
      query ($userId: Int!, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Following (userId: $userId, sort: $sort) {
          ${UserSchema}
        }
      }
    `;
        return await this.execute<UserResponse>(query, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["userId"],
                    message: "The Following query requires a userId.",
                },
            ],
            mappings: FollowingMappings,
            transportOptions: options,
        });
    }
}
