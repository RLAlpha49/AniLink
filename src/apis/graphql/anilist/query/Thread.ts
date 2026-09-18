import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ThreadResponse } from "../interfaces/responses/query/Thread";
import { type ThreadSort, ThreadSortMappings } from "../types/Sort";
import { ThreadSchema } from "../schemas/responses/query/Thread";
import { composeDocument } from "../schemas/selection/composeSelection";
import { splitFieldsOption } from "../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../schemas/selection/fieldsSelection";

/**
 * Keys selected in every composed thread document.
 *
 * `id` is always selected: the handle callers need to follow up with any other call.
 */
export const THREAD_ALWAYS: readonly string[] = ["id"];

/**
 * {@link ThreadVariables} contains variables for the {@link ThreadQuery} operation.
 *
 * See {@link ThreadQuery} and {@link ThreadResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/thread
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
     * `sort` is an array of {@link ThreadSort} values representing the sort order of the thread.
     */
    sort?: ThreadSort[];

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the {@link ThreadQuery.thread} operation.
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
 * {@link ThreadQuery} executes the AniList thread query through {@link AniListOperation}.
 * Its public operation is {@link ThreadQuery.thread}.
 * @see https://docs.anilist.co/reference/object/thread
 */
export class ThreadQuery extends AniListOperation {
    /**
     * {@link ThreadQuery.thread} sends a query request to get thread data.
     *
     * @param variables - Values from {@link ThreadVariables} for the query; at least one variable other
     * than `asHtml` must be set.
     * @returns The {@link ThreadResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/thread
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<ThreadResponse, K | "id">`:
     * the always-selected `id` is part of the narrowed type because the composed document always sends it.
     * Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new ThreadQuery().thread({ id: 1 });
     * ```
     */
    async thread(
        variables: ThreadVariables,
        options?: RequestOptions & { fields?: undefined }
    ): Promise<ThreadResponse>;
    async thread(
        variables: ThreadVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<ThreadResponse>;
    async thread<K extends FieldPath<ThreadResponse>>(
        variables: ThreadVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<ThreadResponse, K | "id">>;
    async thread(
        variables: ThreadVariables,
        options?: RequestOptions & FieldsSelection<ThreadResponse>
    ): FieldsResult<ThreadResponse, "id"> {
        const query = `
      query ($id: Int, $userId: Int, $replyUserId: Int, $subscribed: Boolean, $categoryId: Int, $mediaCategoryId: Int, $search: String, $id_in: [Int], $sort: [ThreadSort], $asHtml: Boolean) {
        Thread (id: $id, userId: $userId, replyUserId: $replyUserId, subscribed: $subscribed, categoryId: $categoryId, mediaCategoryId: $mediaCategoryId, search: $search, id_in: $id_in, sort: $sort) {
          ${ThreadSchema}
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<ThreadResponse>(
            composeDocument(query, fields, THREAD_ALWAYS),
            variables,
            {
                requirements: [
                    {
                        kind: "notOnly",
                        names: ["asHtml"],
                        message: "The Thread query requires at least one filter variable.",
                    },
                ],
                mappings: ThreadMappings,
                transportOptions,
            }
        );
    }
}
