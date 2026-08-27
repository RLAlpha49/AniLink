import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type ThreadCommentsPageResponse } from "../../interfaces/responses/page/ThreadComments";
import { ThreadSortMappings } from "../../types/Sort";
import { ThreadCommentSchema } from "../../schemas/responses/query/ThreadComment";

/**
 * {@link ThreadCommentsVariables} contains variables for the {@link ThreadCommentsQuery} operation.
 *
 * See {@link ThreadCommentsQuery} and {@link ThreadCommentsPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export interface ThreadCommentsVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

    /**
     * `id` is a number representing the id of the thread comment.
     */
    id?: number;

    /**
     * `threadId` is a number representing the id of the thread.
     */
    threadId?: number;

    /**
     * `userId` is a number representing the id of the user.
     */
    userId?: number;

    /**
     * `sort` is an array of strings representing the sort order.
     */
    sort?: string[];

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the `threadComments` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ThreadCommentsMappings = {
    page: "number",
    perPage: "number",
    id: "number",
    threadId: "number",
    userId: "number",
    sort: ThreadSortMappings,
    asHtml: "boolean",
};

/**
 * {@link ThreadCommentsQuery} executes the paginated AniList thread-comments query through {@link AniListOperation}.
 * Its public operation is {@link ThreadCommentsQuery.threadComments}.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export class ThreadCommentsQuery extends AniListOperation {
    /**
     * `threadComments` is a method that sends a query request to get thread comments.
     *
     * @param variables - Values from {@link ThreadCommentsVariables} for the query.
     * @returns The {@link ThreadCommentsPageResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/threadcomment
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ThreadCommentsQuery().threadComments({ threadId: 1, page: 1 });
     * ```
     */
    async threadComments(
        variables: ThreadCommentsVariables,
        options?: RequestOptions
    ): Promise<ThreadCommentsPageResponse> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $threadId: Int, $userId: Int, $sort: [ThreadCommentSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          threadComments (id: $id, threadId: $threadId, userId: $userId, sort: $sort) {
            ${ThreadCommentSchema}
          }
        }
      }
    `;
        return await this.execute<ThreadCommentsPageResponse>(query, variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["threadId", "userId"],
                    message: "The Page.threadComments query requires a threadId or a userId.",
                },
            ],
            mappings: ThreadCommentsMappings,
            transportOptions: options,
        });
    }
}
