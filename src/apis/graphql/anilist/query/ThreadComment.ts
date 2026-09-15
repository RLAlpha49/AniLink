import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ThreadCommentResponse } from "../interfaces/responses/query/ThreadComment";
import { type ThreadSort, ThreadSortMappings } from "../types/Sort";
import { ThreadCommentSchema } from "../schemas/responses/query/ThreadComment";
import { composeDocument } from "../schemas/selection/composeSelection";
import { splitFieldsOption } from "../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../schemas/selection/fieldsSelection";

/**
 * Keys selected in every composed threadcomment document.
 *
 * `id` is always selected: the handle callers need to follow up with any other call.
 */
export const THREAD_COMMENT_ALWAYS: readonly string[] = ["id"];

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
     * `sort` is an array of {@link ThreadSort} values representing the sort order of the thread comment.
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
     * AniList types the field as a list, so the resolved value is an array even when the filters
     * match one comment.
     *
     * @param variables - Values from {@link ThreadCommentVariables} for the query; at least one variable other
     * than `asHtml` must be set.
     * @returns The {@link ThreadCommentResponse} data; the resolved value is an array of comments
     * at runtime.
     * @see https://docs.anilist.co/reference/object/threadcomment
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<ThreadCommentResponse, K | "id">`:
     * the always-selected `id` is part of the narrowed type because the composed document always sends it.
     * Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new ThreadCommentQuery().threadComment({ threadId: 1 });
     * ```
     */
    async threadComment(
        variables: ThreadCommentVariables,
        options?: RequestOptions
    ): Promise<ThreadCommentResponse>;
    async threadComment(
        variables: ThreadCommentVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<ThreadCommentResponse>;
    async threadComment<K extends FieldPath<ThreadCommentResponse>>(
        variables: ThreadCommentVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<ThreadCommentResponse, K | "id">>;
    async threadComment(
        variables: ThreadCommentVariables,
        options?: RequestOptions & FieldsSelection<ThreadCommentResponse>
    ): FieldsResult<ThreadCommentResponse, "id"> {
        const query = `
      query ($id: Int, $threadId: Int, $userId: Int, $sort: [ThreadCommentSort], $asHtml: Boolean) {
        ThreadComment (id: $id, threadId: $threadId, userId: $userId, sort: $sort) {
          ${ThreadCommentSchema}
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<ThreadCommentResponse>(
            composeDocument(query, fields, THREAD_COMMENT_ALWAYS),
            variables,
            {
                requirements: [
                    {
                        kind: "notOnly",
                        names: ["asHtml"],
                        message: "The ThreadComment query requires at least one filter variable.",
                    },
                ],
                mappings: ThreadCommentMappings,
                transportOptions,
            }
        );
    }
}
