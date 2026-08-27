import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";
import { type LikeableType, LikeableTypeMappings } from "../../types/Type";
import { type LikesPageResponse } from "../../interfaces/responses/page/Likes";
import { BasicUserSchema } from "../../schemas/Basic";

/**
 * {@link LikesVariables} contains variables for the {@link LikesQuery} operation.
 *
 * See {@link LikesQuery} and {@link LikesPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/union/likeableunion
 */
export interface LikesVariables {
    /**
     * `likeableId` is a number representing the id of the likeable item.
     */
    likeableId?: number;

    /**
     * `type` is a string representing the type of the likeable item.
     */
    type?: LikeableType;

    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;
}

/**
 * Validation metadata maps variables to runtime types for the `likes` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const LikesMappings = {
    likeableId: "number",
    type: LikeableTypeMappings,
    page: "number",
    perPage: "number",
};

/**
 * {@link LikesQuery} executes the paginated AniList likes query through {@link AniListOperation}.
 * Its public operation is {@link LikesQuery.likes}.
 * @see https://docs.anilist.co/reference/union/likeableunion
 */
export class LikesQuery extends AniListOperation {
    /**
     * `likes` is a method that sends a query request to get likes.
     *
     * @param variables - Values from {@link LikesVariables} for the query.
     * @returns The {@link LikesPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/union/likeableunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new LikesQuery().likes({ likeableId: 1, type: "ACTIVITY" });
     * ```
     */
    async likes(variables: LikesVariables, options?: RequestOptions): Promise<LikesPageResponse> {
        const query = `
      query ($likeableId: Int, $type: LikeableType, $page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          likes (likeableId: $likeableId, type: $type) {
            ${BasicUserSchema}
          }
        }
      }
    `;
        return await this.execute<LikesPageResponse>(query, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["likeableId", "type"],
                    message: "The Page.likes query requires both a likeableId and a type.",
                },
            ],
            mappings: LikesMappings,
            transportOptions: options,
        });
    }
}
