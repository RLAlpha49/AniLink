import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type MediaListsPageResponse } from "../../interfaces/responses/page/MediaLists";
import { MediaTypeMappings } from "../../types/Type";
import { MediaListStatusMappings } from "../../types/Status";
import { MediaListSortMappings } from "../../types/Sort";
import { ScoreFormatMapping } from "../../types/Format";
import { MediaListSchema } from "../../schemas/responses/query/MediaList";
import { composeDocument } from "../../schemas/selection/composeSelection";
import { PAGE_ALWAYS, splitFieldsOption } from "../../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../../schemas/selection/fieldsSelection";

/**
 * {@link MediaListsVariables} contains variables for the {@link MediaListsQuery} operation.
 *
 * See {@link MediaListsQuery} and {@link MediaListsPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/medialist
 */
export interface MediaListsVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

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
     * `type` is a string representing the type of the media; a `MediaType` value.
     */
    type?: string;

    /**
     * `status` is a string representing the status of the media list entry; a `MediaListStatus` value.
     */
    status?: string;

    /**
     * `mediaId` is a number representing the id of the media.
     */
    mediaId?: number;

    /**
     * `isFollowing` is a boolean representing whether the user is following the media.
     */
    isFollowing?: boolean;

    /**
     * `notes` is a string representing the notes for the media list.
     */
    notes?: string;

    /**
     * `startedAt` is a number representing the start date of the media list. AniList's `FuzzyDateInt` form: a `YYYYMMDD` integer (for example `19980401`); build it with `aniLink.anilist.fuzzyDateInt`.
     */
    startedAt?: number;

    /**
     * `completedAt` is a number representing the completion date of the media list. AniList's `FuzzyDateInt` form: a `YYYYMMDD` integer (for example `19980401`); build it with `aniLink.anilist.fuzzyDateInt`.
     */
    completedAt?: number;

    /**
     * `compareWithAuthList` is a boolean limiting entries to those also on the authenticated user's
     * list; requires `userId` or `userName`.
     */
    compareWithAuthList?: boolean;

    /**
     * `userId_in` is an array of numbers representing the user ids that should be included.
     */
    userId_in?: number[];

    /**
     * `status_in` is an array of strings representing the statuses to include; `MediaListStatus` values.
     */
    status_in?: string[];

    /**
     * `status_not_in` is an array of strings representing the statuses to exclude; `MediaListStatus` values.
     */
    status_not_in?: string[];

    /**
     * `status_not` is a string representing the status to exclude; a `MediaListStatus` value.
     */
    status_not?: string;

    /**
     * `mediaId_in` is an array of numbers representing the media ids that should be included.
     */
    mediaId_in?: number[];

    /**
     * `mediaId_not_in` is an array of numbers representing the media ids that should not be included.
     */
    mediaId_not_in?: number[];

    /**
     * `notes_like` is a string representing the notes that should be included.
     */
    notes_like?: string;

    /**
     * `startedAt_greater` is a number representing the minimum start date.
     */
    startedAt_greater?: number;

    /**
     * `startedAt_lesser` is a number representing the maximum start date.
     */
    startedAt_lesser?: number;

    /**
     * `startedAt_like` is a string representing the start date that should be included.
     */
    startedAt_like?: string;

    /**
     * `completedAt_greater` is a number representing the minimum completion date.
     */
    completedAt_greater?: number;

    /**
     * `completedAt_lesser` is a number representing the maximum completion date.
     */
    completedAt_lesser?: number;

    /**
     * `completedAt_like` is a string representing the completion date that should be included.
     */
    completedAt_like?: string;

    /**
     * `sort` is an array of strings representing the sort order; `MediaListSort` values.
     */
    sort?: string[];

    /**
     * `scoreFormat` is a string representing the score format.
     */
    scoreFormat?: string;

    /**
     * `asArray` is a boolean representing whether to return the result as an array.
     */
    asArray?: boolean;

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the `mediaLists` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const MediaListsMappings = {
    page: "number",
    perPage: "number",
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
 * {@link MediaListsQuery} executes the paginated AniList media-lists query through {@link AniListOperation}.
 * Its public operation is {@link MediaListsQuery.mediaLists}.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export class MediaListsQuery extends AniListOperation {
    /**
     * {@link MediaListsQuery.mediaLists} sends a query request to get a page of media list entries.
     *
     * @param variables - Values from {@link MediaListsVariables} for the query; either `userId` or `userName`
     * must be set, and `page` and `perPage` select the slice of results.
     * @returns The {@link MediaListsPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/object/medialist
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<MediaListsPageResponse, K | "pageInfo">`:
     * the always-selected `pageInfo` is part of the narrowed type because the composed document always sends
     * it. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new MediaListsQuery().mediaLists({ userId: 1, page: 1, perPage: 10 });
     * ```
     */
    async mediaLists(
        variables: MediaListsVariables,
        options?: RequestOptions & { fields?: undefined }
    ): Promise<MediaListsPageResponse>;
    async mediaLists(
        variables: MediaListsVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<MediaListsPageResponse>;
    async mediaLists<K extends FieldPath<MediaListsPageResponse>>(
        variables: MediaListsVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<MediaListsPageResponse, K | "pageInfo">>;
    async mediaLists(
        variables: MediaListsVariables,
        options?: RequestOptions & FieldsSelection<MediaListsPageResponse>
    ): FieldsResult<MediaListsPageResponse, "pageInfo"> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $userId: Int, $userName: String, $type: MediaType, $status: MediaListStatus, $mediaId: Int, $isFollowing: Boolean, $notes: String, $startedAt: FuzzyDateInt, $completedAt: FuzzyDateInt, $compareWithAuthList: Boolean, $userId_in: [Int], $status_in: [MediaListStatus], $status_not_in: [MediaListStatus], $status_not: MediaListStatus, $mediaId_in: [Int], $mediaId_not_in: [Int], $notes_like: String, $startedAt_greater: FuzzyDateInt, $startedAt_lesser: FuzzyDateInt, $startedAt_like: String, $completedAt_greater: FuzzyDateInt, $completedAt_lesser: FuzzyDateInt, $completedAt_like: String, $sort: [MediaListSort], $scoreFormat: ScoreFormat, $asArray: Boolean, $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          mediaList (id: $id, userId: $userId, userName: $userName, type: $type, status: $status, mediaId: $mediaId, isFollowing: $isFollowing, notes: $notes, startedAt: $startedAt, completedAt: $completedAt, compareWithAuthList: $compareWithAuthList, userId_in: $userId_in, status_in: $status_in, status_not_in: $status_not_in, status_not: $status_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, notes_like: $notes_like, startedAt_greater: $startedAt_greater, startedAt_lesser: $startedAt_lesser, startedAt_like: $startedAt_like, completedAt_greater: $completedAt_greater, completedAt_lesser: $completedAt_lesser, completedAt_like: $completedAt_like, sort: $sort) {
            ${MediaListSchema}
          }
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<MediaListsPageResponse>(
            composeDocument(query, fields, PAGE_ALWAYS),
            variables,
            {
                requirements: [
                    {
                        kind: "any",
                        names: ["userId", "userName"],
                        message: "The Page.mediaList query requires either a userId or a userName.",
                    },
                ],
                mappings: MediaListsMappings,
                transportOptions,
            }
        );
    }
}
