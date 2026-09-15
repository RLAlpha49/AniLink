import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type ThreadsPageResponse } from "../../interfaces/responses/page/Threads";
import { ThreadSortMappings } from "../../types/Sort";
import { ThreadSchema } from "../../schemas/responses/query/Thread";
import { composeDocument } from "../../schemas/selection/composeSelection";
import { PAGE_ALWAYS, splitFieldsOption } from "../../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../../schemas/selection/fieldsSelection";

/**
 * {@link ThreadsVariables} contains variables for the {@link ThreadsQuery} operation.
 *
 * See {@link ThreadsQuery} and {@link ThreadsPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/thread
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
     * `sort` is an array of strings representing the sort order; `ThreadSort` values.
     */
    sort?: string[];

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the `threads` operation.
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
 * {@link ThreadsQuery} executes the paginated AniList threads query through {@link AniListOperation}.
 * Its public operation is {@link ThreadsQuery.threads}.
 * @see https://docs.anilist.co/reference/object/thread
 */
export class ThreadsQuery extends AniListOperation {
    /**
     * {@link ThreadsQuery.threads} sends a query request to get a page of forum threads.
     *
     * @param variables - Values from {@link ThreadsVariables} for the query; `page` and `perPage` select the
     * slice of results.
     * @returns The {@link ThreadsPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/object/thread
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<ThreadsPageResponse, K | "pageInfo">`:
     * the always-selected `pageInfo` is part of the narrowed type because the composed document always sends
     * it. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new ThreadsQuery().threads({ page: 1, perPage: 10 });
     * ```
     */
    async threads(
        variables: ThreadsVariables,
        options?: RequestOptions
    ): Promise<ThreadsPageResponse>;
    async threads(
        variables: ThreadsVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<ThreadsPageResponse>;
    async threads<K extends FieldPath<ThreadsPageResponse>>(
        variables: ThreadsVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<ThreadsPageResponse, K | "pageInfo">>;
    async threads(
        variables: ThreadsVariables,
        options?: RequestOptions & FieldsSelection<ThreadsPageResponse>
    ): FieldsResult<ThreadsPageResponse, "pageInfo"> {
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
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<ThreadsPageResponse>(
            composeDocument(query, fields, PAGE_ALWAYS),
            variables,
            {
                mappings: ThreadsMappings,
                transportOptions,
            }
        );
    }
}
