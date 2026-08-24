import { APIWrapper } from "../../../../base/APIWrapper";
import type { RequestOptions } from "../../../../base/RequestHandler";

import { type ThreadsPageResponse } from "../../interfaces/responses/page/Threads";
import { ThreadSortMappings } from "../../types/Sort";
import { ThreadSchema } from "../../schemas/responses/query/Thread";

/**
 * `ThreadsVariables` is an interface representing the variables for the `ThreadsQuery`.
 * It includes optional page, per page, id, user id, reply user id, subscribed, category id, media category id, search, id in, sort, and as html.
 * @see https://docs.anilist.co/reference/query
 */
export interface ThreadsVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

    /**
     * `id` is a number representing the id of the thread.
     */
    id?: number;

    /**
     * `userId` is a number representing the id of the user.
     */
    userId?: number;

    /**
     * `replyUserId` is a number representing the id of the reply user.
     */
    replyUserId?: number;

    /**
     * `subscribed` is a boolean representing whether the user is subscribed.
     */
    subscribed?: boolean;

    /**
     * `categoryId` is a number representing the id of the category.
     */
    categoryId?: number;

    /**
     * `mediaCategoryId` is a number representing the id of the media category.
     */
    mediaCategoryId?: number;

    /**
     * `search` is a string representing the search term.
     */
    search?: string;

    /**
     * `id_in` is an array of numbers representing the ids of the threads that should be included.
     */
    id_in?: number[];

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
 * The variable type mappings for the `threads` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ThreadsMappings = {
    page: "number",
    perPage: "number",
    id: "number",
    userId: "number",
    replyUserId: "number",
    subscribed: "boolean",
    categoryId: "number",
    mediaCategoryId: "number",
    search: "string",
    id_in: "number[]",
    sort: ThreadSortMappings,
    asHtml: "boolean",
};

/**
 * `ThreadsQuery` is a class representing a query for threads.
 * It includes a method to get threads.
 * @see https://docs.anilist.co/reference/object/thread
 */
export class ThreadsQuery extends APIWrapper {
    /**
     * `threads` is a method that sends a query request to get threads.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/thread
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async threads(
        variables: ThreadsVariables,
        options?: RequestOptions
    ): Promise<ThreadsPageResponse> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $userId: Int, $replyUserId: Int, $subscribed: Boolean, $categoryId: Int, $mediaCategoryId: Int, $search: String, $id_in: [Int], $sort: [ThreadSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          threads (id: $id, userId: $userId, replyUserId: $replyUserId, subscribed: $subscribed, categoryId: $categoryId, mediaCategoryId: $mediaCategoryId, search: $search, id_in: $id_in, sort: $sort) {
            ${ThreadSchema}
          }
        }
      }
    `;
        return await this.execute<ThreadsPageResponse>(query, variables, {
            mappings: ThreadsMappings,
            transportOptions: options,
        });
    }
}
