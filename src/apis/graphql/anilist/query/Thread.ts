import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ThreadResponse } from "../interfaces/responses/query/Thread";
import { type ThreadSort, ThreadSortMappings } from "../types/Sort";
import { ThreadSchema } from "../schemas/responses/query/Thread";

/**
 * `ThreadVariables` is an interface representing the variables for the `ThreadQuery`.
 * It includes optional parameters for querying thread data.
 * @see https://docs.anilist.co/reference/query
 */
export interface ThreadVariables {
    /**
     * `id` is a number representing the id of the thread.
     */
    id?: number;

    /**
     * `userId` is a number representing the id of the user.
     */
    userId?: number;

    /**
     * `replyUserId` is a number representing the id of the user who replied.
     */
    replyUserId?: number;

    /**
     * `subscribed` is a boolean indicating whether the user is subscribed to the thread.
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
     * `id_in` is an array of numbers representing the ids to include in the search.
     */
    id_in?: number[];

    /**
     * `sort` is an array of strings representing the sort order of the thread.
     */
    sort?: ThreadSort[];

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * The variable type mappings for the `thread` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ThreadMappings = {
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
 * `ThreadQuery` is a class representing a query for thread data.
 * It includes a method to send the thread query and receive the response.
 * @see https://docs.anilist.co/reference/object/thread
 */
export class ThreadQuery extends AniListOperation {
    /**
     * `thread` is a method that sends a query request to get thread data.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/thread
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async thread(variables: ThreadVariables, options?: RequestOptions): Promise<ThreadResponse> {
        const query = `
      query ($id: Int, $userId: Int, $replyUserId: Int, $subscribed: Boolean, $categoryId: Int, $mediaCategoryId: Int, $search: String, $id_in: [Int], $sort: [ThreadSort], $asHtml: Boolean) {
        Thread (id: $id, userId: $userId, replyUserId: $replyUserId, subscribed: $subscribed, categoryId: $categoryId, mediaCategoryId: $mediaCategoryId, search: $search, id_in: $id_in, sort: $sort) {
          ${ThreadSchema}
        }
      }
    `;
        return await this.execute<ThreadResponse>(query, variables, {
            requirements: [
                {
                    kind: "notOnly",
                    names: ["asHtml"],
                    message: "The Thread query requires at least one filter variable.",
                },
            ],
            mappings: ThreadMappings,
            transportOptions: options,
        });
    }
}
