import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type MediaListResponse } from "../interfaces/responses/query/MediaList";
import { type MediaType, MediaTypeMappings } from "../types/Type";
import { type MediaListStatus, MediaListStatusMappings } from "../types/Status";
import { type MediaListSort, MediaListSortMappings } from "../types/Sort";
import { type ScoreFormat, ScoreFormatMapping } from "../types/Format";
import { MediaListSchema } from "../schemas/responses/query/MediaList";
import { composeDocument } from "../schemas/selection/composeSelection";
import { splitFieldsOption } from "../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../schemas/selection/fieldsSelection";

/**
 * Keys selected in every composed medialist document.
 *
 * `id` is always selected: the handle callers need to follow up with any other call.
 */
export const MEDIA_LIST_ALWAYS: readonly string[] = ["id"];

/**
 * {@link MediaListVariables} contains variables for the {@link MediaListQuery} operation.
 *
 * See {@link MediaListQuery} and {@link MediaListResponse} for the operation and response shape.
 *
 * Values are validated with `MediaListMappings` before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/medialist
 */
export interface MediaListVariables {
    /**
     * `id` is a number representing the id of the media list.
     */
    id?: number;

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
    type?: MediaType;

    /**
     * `status` is a string representing the status of the media.
     */
    status?: MediaListStatus;

    /**
     * `mediaId` is a number representing the id of the media.
     */
    mediaId?: number;

    /**
     * `isFollowing` is a boolean indicating whether the user is following the media.
     */
    isFollowing?: boolean;

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
     * `compareWithAuthList` is a boolean indicating whether to compare with the authenticated list.
     */
    compareWithAuthList?: boolean;

    /**
     * `userId_in` is an array of numbers representing the ids of the users.
     */
    userId_in?: number[];

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
     * `mediaId_in` is an array of numbers representing the ids of the media.
     */
    mediaId_in?: number[];

    /**
     * `mediaId_not_in` is an array of numbers representing the ids not included in the media.
     */
    mediaId_not_in?: number[];

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
 * Validation metadata maps variables to runtime types for the {@link MediaListQuery.mediaList} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const MediaListMappings = {
    id: "number",
    userId: "number",
    userName: "string",
    type: MediaTypeMappings,
    status: MediaListStatusMappings,
    mediaId: "number",
    isFollowing: "boolean",
    notes: "string",
    startedAt: "number",
    completedAt: "number",
    compareWithAuthList: "boolean",
    userId_in: "number[]",
    status_in: MediaListStatusMappings,
    status_not_in: MediaListStatusMappings,
    status_not: MediaListStatusMappings,
    mediaId_in: "number[]",
    mediaId_not_in: "number[]",
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
 * {@link MediaListQuery} executes the AniList media-list query through {@link AniListOperation}.
 * Its public operation is {@link MediaListQuery.mediaList}.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export class MediaListQuery extends AniListOperation {
    /**
     * {@link MediaListQuery.mediaList} sends a query request to get media list data.
     *
     * @param variables - Values from {@link MediaListVariables} for the query.
     * @returns The {@link MediaListResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/medialist
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new MediaListQuery().mediaList({ id: 1 });
     * ```
     */
    async mediaList(
        variables: MediaListVariables,
        options?: RequestOptions
    ): Promise<MediaListResponse>;
    async mediaList(
        variables: MediaListVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<MediaListResponse>;
    async mediaList<K extends FieldPath<MediaListResponse>>(
        variables: MediaListVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<MediaListResponse, K | "id">>;
    async mediaList(
        variables: MediaListVariables,
        options?: RequestOptions & FieldsSelection<MediaListResponse>
    ): FieldsResult<MediaListResponse, "id"> {
        const query = `
            query ($id: Int, $userId: Int, $userName: String, $type: MediaType, $status: MediaListStatus, $mediaId: Int, $isFollowing: Boolean, $notes: String, $startedAt: FuzzyDateInt, $completedAt: FuzzyDateInt, $compareWithAuthList: Boolean, $userId_in: [Int], $status_in: [MediaListStatus], $status_not_in: [MediaListStatus], $status_not: MediaListStatus, $mediaId_in: [Int], $mediaId_not_in: [Int], $notes_like: String, $startedAt_greater: FuzzyDateInt, $startedAt_lesser: FuzzyDateInt, $startedAt_like: String, $completedAt_greater: FuzzyDateInt, $completedAt_lesser: FuzzyDateInt, $completedAt_like: String, $sort: [MediaListSort], $scoreFormat: ScoreFormat, $asArray: Boolean, $asHtml: Boolean) {
                MediaList (id: $id, userId: $userId, userName: $userName, type: $type, status: $status, mediaId: $mediaId, isFollowing: $isFollowing, notes: $notes, startedAt: $startedAt, completedAt: $completedAt, compareWithAuthList: $compareWithAuthList, userId_in: $userId_in, status_in: $status_in, status_not_in: $status_not_in, status_not: $status_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, notes_like: $notes_like, startedAt_greater: $startedAt_greater, startedAt_lesser: $startedAt_lesser, startedAt_like: $startedAt_like, completedAt_greater: $completedAt_greater, completedAt_lesser: $completedAt_lesser, completedAt_like: $completedAt_like, sort: $sort) {
          ${MediaListSchema}
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<MediaListResponse>(
            composeDocument(query, fields, MEDIA_LIST_ALWAYS),
            variables,
            {
                mappings: MediaListMappings,
                transportOptions,
            }
        );
    }
}
