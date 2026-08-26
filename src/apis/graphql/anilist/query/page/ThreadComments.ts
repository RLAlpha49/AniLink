import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type ThreadCommentsPageResponse } from "../../interfaces/responses/page/ThreadComments";
import { ThreadSortMappings } from "../../types/Sort";
import { ThreadCommentSchema } from "../../schemas/responses/query/ThreadComment";

/**
 * `ThreadCommentsVariables` is an interface representing the variables for the `ThreadCommentsQuery`.
 * The AniList API requires a `threadId` or a `userId`; the remaining parameters are optional.
 * @see https://docs.anilist.co/reference/query
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
 * The variable type mappings for the `threadComments` operation.
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
 * `ThreadCommentsQuery` is a class representing a query for thread comments.
 * It includes a method to get thread comments.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export class ThreadCommentsQuery extends AniListOperation {
    /**
     * `threadComments` is a method that sends a query request to get thread comments.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/threadcomment
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
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
