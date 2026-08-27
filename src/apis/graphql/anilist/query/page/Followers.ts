import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type FollowersPageResponse } from "../../interfaces/responses/page/Followers";
import { UserSortMappings, UserStatisticSortMappings } from "../../types/Sort";
import { UserSchema } from "../../schemas/responses/query/User";

/**
 * {@link FollowersVariables} contains variables for the {@link FollowersQuery} operation.
 *
 * See {@link FollowersQuery} and {@link FollowersPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/user
 */
export interface FollowersVariables {
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
 * Validation metadata maps variables to runtime types for the `followers` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const FollowersMappings = {
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
 * {@link FollowersQuery} executes the paginated AniList followers query through {@link AniListOperation}.
 * Its public operation is {@link FollowersQuery.followers}.
 * @see https://docs.anilist.co/reference/object/user
 */
export class FollowersQuery extends AniListOperation {
    /**
     * `followers` is a method that sends a query request to get followers.
     *
     * @param variables - Values from {@link FollowersVariables} for the query.
     * @returns The {@link FollowersPageResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new FollowersQuery().followers({ userId: 1, page: 1, perPage: 10 });
     * ```
     */
    async followers(
        variables: FollowersVariables,
        options?: RequestOptions
    ): Promise<FollowersPageResponse> {
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
          followers (userId: $userId, sort: $sort) {
            ${UserSchema}
          }
        }
      }
    `;
        return await this.execute<FollowersPageResponse>(query, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["userId"],
                    message: "The Page.followers query requires a userId.",
                },
            ],
            mappings: FollowersMappings,
            transportOptions: options,
        });
    }
}
