import { APIWrapper } from "../../../../base/APIWrapper";
import { type LikeableType, LikeableTypeMappings } from "../../types/Type";
import { type LikesPageResponse } from "../../interfaces/responses/page/Likes";
import { BasicUserSchema } from "../../schemas/Basic";

/**
 * `LikesVariables` is an interface representing the variables for the `LikesQuery`.
 * The AniList API requires both `likeableId` and `type`; `page` and `perPage` are optional.
 * @see https://docs.anilist.co/reference/query
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
 * `LikesQuery` is a class representing a query for likes.
 * It includes a method to get likes.
 * @see https://docs.anilist.co/reference/union/likeableunion
 */
export class LikesQuery extends APIWrapper {
    /**
     * `likes` is a method that sends a query request to get likes.
     *
     * @param variables - The variables for the query.
     * @returns The users who liked the item for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/union/likeableunion
     */
    async likes(variables: LikesVariables): Promise<LikesPageResponse> {
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
            mappings: {
                likeableId: "number",
                type: LikeableTypeMappings,
                page: "number",
                perPage: "number",
            },
        });
    }
}
