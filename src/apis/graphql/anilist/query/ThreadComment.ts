import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ThreadCommentResponse } from "../interfaces/responses/query/ThreadComment";
import { type ThreadSort, ThreadSortMappings } from "../types/Sort";
import { ThreadCommentSchema } from "../schemas/responses/query/ThreadComment";

/**
 * {@link ThreadCommentVariables} contains variables for the {@link ThreadCommentQuery} operation.
 *
 * See {@link ThreadCommentQuery} and {@link ThreadCommentResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/threadcomment
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
 * Validation metadata maps variables to runtime types for the {@link ThreadCommentQuery.threadComment} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ThreadCommentMappings = {
    id: "number",
    threadId: "number",
    userId: "number",
    sort: ThreadSortMappings,
    asHtml: "boolean",
};

/**
 * {@link ThreadCommentQuery} executes the AniList thread-comment query through {@link AniListOperation}.
 * Its public operation is {@link ThreadCommentQuery.threadComment}.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export class ThreadCommentQuery extends AniListOperation {
    /**
     * {@link ThreadCommentQuery.threadComment} sends a query request to get thread comment data.
     *
     * @param variables - Values from {@link ThreadCommentVariables} for the query.
     * @returns The {@link ThreadCommentResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/threadcomment
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ThreadCommentQuery().threadComment({ threadId: 1 });
     * ```
     */
    async threadComment(
        variables: ThreadCommentVariables,
        options?: RequestOptions
    ): Promise<ThreadCommentResponse> {
        const query = `
      query ($id: Int, $threadId: Int, $userId: Int, $sort: [ThreadCommentSort], $asHtml: Boolean) {
        ThreadComment (id: $id, threadId: $threadId, userId: $userId, sort: $sort) {
          ${ThreadCommentSchema}
        }
      }
    `;
        return await this.execute<ThreadCommentResponse>(query, variables, {
            requirements: [
                {
                    kind: "notOnly",
                    names: ["asHtml"],
                    message: "The ThreadComment query requires at least one filter variable.",
                },
            ],
            mappings: ThreadCommentMappings,
            transportOptions: options,
        });
    }
}
