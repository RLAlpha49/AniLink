import { APIWrapper } from "../../../base/APIWrapper";
import { type ThreadCommentResponse } from "../interfaces/responses/query/ThreadComment";
import { type ThreadSort, ThreadSortMappings } from "../types/Sort";
import { requireVariables, validateVariables } from "../../../base/ValidateVariables";
import { ThreadCommentSchema } from "../schemas/responses/query/ThreadComment";

/**
 * `ThreadCommentVariables` is an interface representing the variables for the `ThreadCommentQuery`.
 * It includes optional parameters for querying thread comment data.
 * @see https://docs.anilist.co/reference/query
 */
export interface ThreadCommentVariables {
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
     * `sort` is an array of strings representing the sort order of the thread comment.
     */
    sort?: ThreadSort[];

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * `ThreadCommentQuery` is a class representing a query for thread comment data.
 * It includes a method to send the thread comment query and receive the response.
 * @see https://docs.anilist.co/reference/query
 */
export class ThreadCommentQuery extends APIWrapper {
    /**
     * `threadComment` is a method that sends a query request to get thread comment data.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/query
     */
    async threadComment(variables: ThreadCommentVariables): Promise<ThreadCommentResponse> {
        requireVariables(
            variables,
            { kind: "notOnly", names: ["asHtml"] },
            "The ThreadComment query requires at least one filter variable."
        );
        const variableTypeMappings = {
            id: "number",
            threadId: "number",
            userId: "number",
            sort: ThreadSortMappings,
            asHtml: "boolean",
        };

        validateVariables(variables, variableTypeMappings);

        const query = `
      query ($id: Int, $threadId: Int, $userId: Int, $sort: [ThreadCommentSort], $asHtml: Boolean) {
        ThreadComment (id: $id, threadId: $threadId, userId: $userId, sort: $sort) {
          ${ThreadCommentSchema}
        }
      }
    `;

        return await this.request(query, variables);
    }
}
