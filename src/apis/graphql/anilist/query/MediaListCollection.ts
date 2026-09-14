import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type MediaListCollectionResponse } from "../interfaces/responses/query/MediaListCollectionResponse";
import { type MediaType, MediaTypeMappings } from "../types/Type";
import { type MediaListStatus, MediaListStatusMappings } from "../types/Status";
import { type MediaListSort, MediaListSortMappings } from "../types/Sort";
import { type ScoreFormat, ScoreFormatMapping } from "../types/Format";
import { MediaListCollectionQuerySchema } from "../schemas/responses/query/MediaListCollectionResponse";
import { composeDocument } from "../schemas/selection/composeSelection";
import { splitFieldsOption } from "../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../schemas/selection/fieldsSelection";

/**
 * Keys selected in every composed medialistcollection document: the chunk
 * continuation flag the shared `paginateChunks` helper walks.
 */
export const MEDIA_LIST_COLLECTION_ALWAYS: readonly string[] = ["hasNextChunk"];

/**
 * {@link MediaListCollectionVariables} contains variables for the {@link MediaListCollectionQuery} operation.
 *
 * See {@link MediaListCollectionQuery} and {@link MediaListCollectionResponse} for the operation and response shape.
 *
 * Values are validated with `MediaListCollectionMappings` before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/medialistcollection
 */
export interface MediaListCollectionVariables {
    /**
     * `userId` is a number representing the id of the user.
     */
    userId?: number;

    /**
     * `userName` is a string representing the name of the user.
     */
    userName?: string;

    /**
     * `type` is a string representing the type of the media.
     */
    type: MediaType;

    /**
     * `status` is a string representing the status of the media.
     */
    status?: MediaListStatus;

    /**
     * `notes` is a string representing any notes about the media.
     */
    notes?: string;

    /**
     * `startedAt` is a number representing the start date of the media. AniList's `FuzzyDateInt` form: a `YYYYMMDD` integer (for example `19980401`); build it with `aniLink.anilist.fuzzyDateInt`.
     */
    startedAt?: number;

    /**
     * `completedAt` is a number representing the completion date of the media. AniList's `FuzzyDateInt` form: a `YYYYMMDD` integer (for example `19980401`); build it with `aniLink.anilist.fuzzyDateInt`.
     */
    completedAt?: number;

    /**
     * `forceSingleCompletedList` is a boolean indicating whether to force a single completed list.
     */
    forceSingleCompletedList?: boolean;

    /**
     * `chunk` is a 1-based number selecting which chunk of the media list collection to fetch.
     * Advance it while the response's `hasNextChunk` is `true` to walk the whole list.
     */
    chunk?: number;

    /**
     * `perChunk` is the number of entries to return per chunk. Pair with `chunk` to page
     * through a large list one chunk at a time.
     */
    perChunk?: number;

    /**
     * `status_in` is an array of strings representing the statuses of the media.
     */
    status_in?: MediaListStatus[];

    /**
     * `status_not_in` is an array of strings representing the statuses not included in the media.
     */
    status_not_in?: MediaListStatus[];

    /**
     * `status_not` is a string representing the status not included in the media.
     */
    status_not?: MediaListStatus;

    /**
     * `notes_like` is a string representing the notes similar to the media.
     */
    notes_like?: string;

    /**
     * `startedAt_greater` is a number representing the start date greater than the media. AniList's `FuzzyDateInt` form: a `YYYYMMDD` integer (for example `19980401`).
     */
    startedAt_greater?: number;

    /**
     * `startedAt_lesser` is a number representing the start date lesser than the media. AniList's `FuzzyDateInt` form: a `YYYYMMDD` integer (for example `19980401`).
     */
    startedAt_lesser?: number;

    /**
     * `startedAt_like` is a string representing the start date similar to the media.
     */
    startedAt_like?: string;

    /**
     * `completedAt_greater` is a number representing the completion date greater than the media. AniList's `FuzzyDateInt` form: a `YYYYMMDD` integer (for example `19980401`).
     */
    completedAt_greater?: number;

    /**
     * `completedAt_lesser` is a number representing the completion date lesser than the media. AniList's `FuzzyDateInt` form: a `YYYYMMDD` integer (for example `19980401`).
     */
    completedAt_lesser?: number;

    /**
     * `completedAt_like` is a string representing the completion date similar to the media.
     */
    completedAt_like?: string;

    /**
     * `sort` is an array of strings representing the sort order of the media.
     */
    sort?: MediaListSort[];

    /**
     * `scoreFormat` is a string representing the format of the score of the media.
     */
    scoreFormat?: ScoreFormat;

    /**
     * `asArray` is a boolean indicating whether to return the result as an array.
     */
    asArray?: boolean;

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the {@link MediaListCollectionQuery.mediaListCollection} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const MediaListCollectionMappings = {
    userId: "number",
    userName: "string",
    type: MediaTypeMappings,
    status: "string",
    notes: "string",
    startedAt: "number",
    completedAt: "number",
    forceSingleCompletedList: "boolean",
    chunk: "number",
    perChunk: "number",
    status_in: MediaListStatusMappings,
    status_not_in: MediaListStatusMappings,
    status_not: MediaListStatusMappings,
    notes_like: "string",
    startedAt_greater: "number",
    startedAt_lesser: "number",
    startedAt_like: "string",
    completedAt_greater: "number",
    completedAt_lesser: "number",
    completedAt_like: "string",
    sort: MediaListSortMappings,
    scoreFormat: ScoreFormatMapping,
    asArray: "boolean",
    asHtml: "boolean",
};

/**
 * {@link MediaListCollectionQuery} executes the AniList media-list-collection query through {@link AniListOperation}.
 * Its public operation is {@link MediaListCollectionQuery.mediaListCollection}.
 * @see https://docs.anilist.co/reference/object/medialistcollection
 */
export class MediaListCollectionQuery extends AniListOperation {
    /**
     * {@link MediaListCollectionQuery.mediaListCollection} sends a query request to get media list collection data.
     *
     * Chunk semantics: AniList returns large user lists in chunks. Set `chunk` (1-based) and
     * `perChunk` (entries per chunk) to fetch a single chunk; the response's `hasNextChunk` flag
     * indicates whether more chunks remain. To retrieve an entire list, advance `chunk` from 1
     * while `hasNextChunk` is `true`. Use the shared `paginateChunks` helper (see `src/apis/graphql/anilist/Paginator.ts`)
     * to walk chunks with a `maxChunks` guard instead of hand-rolling the loop:
     *
     * ```typescript
     * const result = await paginateChunks(
     *   (chunk, perChunk) => aniLink.anilist.query.mediaListCollection(
     *     { userId: 542244, type: "ANIME", chunk, perChunk }
     *   ),
     *   "lists",
     *   { perChunk: 500, maxChunks: 20 }
     * );
     * ```
     *
     * @param variables - Values from {@link MediaListCollectionVariables} for the query.
     * @returns The {@link MediaListCollectionResponse} from the query request, including `lists` and `hasNextChunk`.
     * @see https://docs.anilist.co/reference/object/medialistcollection
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new MediaListCollectionQuery().mediaListCollection({
     *     type: "ANIME",
     *     userId: 1,
     * });
     * ```
     */
    async mediaListCollection(
        variables: MediaListCollectionVariables,
        options?: RequestOptions
    ): Promise<MediaListCollectionResponse>;
    async mediaListCollection(
        variables: MediaListCollectionVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<MediaListCollectionResponse>;
    async mediaListCollection<K extends FieldPath<MediaListCollectionResponse>>(
        variables: MediaListCollectionVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<MediaListCollectionResponse, K | "hasNextChunk">>;
    async mediaListCollection(
        variables: MediaListCollectionVariables,
        options?: RequestOptions & FieldsSelection<MediaListCollectionResponse>
    ): FieldsResult<MediaListCollectionResponse, "hasNextChunk"> {
        const query = MediaListCollectionQuerySchema;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<MediaListCollectionResponse>(
            composeDocument(query, fields, MEDIA_LIST_COLLECTION_ALWAYS),
            variables,
            {
                requirements: [
                    {
                        kind: "all",
                        names: ["type"],
                        message: "The MediaListCollection query requires a type variable.",
                    },
                    {
                        kind: "any",
                        names: ["userId", "userName"],
                        message: "The MediaListCollection query requires a userId or a userName.",
                    },
                ],
                mappings: MediaListCollectionMappings,
                transportOptions,
            }
        );
    }
}
