import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type ThreadCommentsPageResponse } from "../../interfaces/responses/page/ThreadComments";
import { ThreadSortMappings } from "../../types/Sort";
import { ThreadCommentSchema } from "../../schemas/responses/query/ThreadComment";
import { composeDocument } from "../../schemas/selection/composeSelection";
import { PAGE_ALWAYS, splitFieldsOption } from "../../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../../schemas/selection/fieldsSelection";

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
     * `sort` is an array of strings representing the sort order; `ThreadSort` values.
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
     * {@link ThreadCommentsQuery.threadComments} sends a query request to get a page of thread comments.
     *
     * @param variables - Values from {@link ThreadCommentsVariables} for the query; `threadId` or `userId`
     * must be set, and `page` and `perPage` select the slice of results.
     * @returns The {@link ThreadCommentsPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/object/threadcomment
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<ThreadCommentsPageResponse, K | "pageInfo">`:
     * the always-selected `pageInfo` is part of the narrowed type because the composed document always sends
     * it. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new ThreadCommentsQuery().threadComments({ threadId: 1, page: 1 });
     * ```
     */
    async threadComments(
        variables: ThreadCommentsVariables,
        options?: RequestOptions
    ): Promise<ThreadCommentsPageResponse>;
    async threadComments(
        variables: ThreadCommentsVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<ThreadCommentsPageResponse>;
    async threadComments<K extends FieldPath<ThreadCommentsPageResponse>>(
        variables: ThreadCommentsVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<ThreadCommentsPageResponse, K | "pageInfo">>;
    async threadComments(
        variables: ThreadCommentsVariables,
        options?: RequestOptions & FieldsSelection<ThreadCommentsPageResponse>
    ): FieldsResult<ThreadCommentsPageResponse, "pageInfo"> {
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
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<ThreadCommentsPageResponse>(
            composeDocument(query, fields, PAGE_ALWAYS),
            variables,
            {
                requirements: [
                    {
                        kind: "any",
                        names: ["threadId", "userId"],
                        message: "The Page.threadComments query requires a threadId or a userId.",
                    },
                ],
                mappings: ThreadCommentsMappings,
                transportOptions,
            }
        );
    }
}
