import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type StudiosPageResponse } from "../../interfaces/responses/page/Studios";
import { CharacterSortMappings, MediaSortMappings, StudioSortMappings } from "../../types/Sort";
import { StudioSchema } from "../../schemas/responses/query/Studio";
import { composeDocument } from "../../schemas/selection/composeSelection";
import { PAGE_ALWAYS, splitFieldsOption } from "../../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../../schemas/selection/fieldsSelection";

/**
 * {@link StudiosVariables} contains variables for the {@link StudiosQuery} operation.
 *
 * See {@link StudiosQuery} and {@link StudiosPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/studio
 */
export interface StudiosVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

    /**
     * `id` is a number representing the id of the studio.
     */
    id?: number;

    /**
     * `search` is a string representing the search term.
     */
    search?: string;

    /**
     * `id_not` is a number representing the id of the studio that should not be included.
     */
    id_not?: number;

    /**
     * `id_in` is an array of numbers representing the ids of the studios that should be included.
     */
    id_in?: number[];

    /**
     * `id_not_in` is an array of numbers representing the ids of the studios that should not be included.
     */
    id_not_in?: number[];

    /**
     * `sort` is an array of strings representing the sort order; `StudioSort` values.
     */
    sort?: string[];

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;

    /**
     * `mediaSort` is an array of strings representing the sort order for media; `MediaSort` values.
     */
    mediaSort?: string[];

    /**
     * `mediaIsMain` is a boolean representing whether the media is main.
     */
    mediaIsMain?: boolean;

    /**
     * `mediaOnList` is a boolean representing whether the media is on the list.
     */
    mediaOnList?: boolean;

    /**
     * `mediaPage` is a number representing the page number for media.
     */
    mediaPage?: number;

    /**
     * `mediaPerPage` is a number representing the number of media items per page.
     */
    mediaPerPage?: number;

    /**
     * `staffMediaSort` is an array of strings representing the sort order for staff media; `MediaSort` values.
     */
    staffMediaSort?: string[];

    /**
     * `staffMediaType` is a string representing the type of the staff media.
     */
    staffMediaType?: string;

    /**
     * `staffMediaOnList` is a boolean representing whether the staff media is on the list.
     */
    staffMediaOnList?: boolean;

    /**
     * `staffMediaPage` is a number representing the page number for staff media.
     */
    staffMediaPage?: number;

    /**
     * `staffMediaPerPage` is a number representing the number of staff media items per page.
     */
    staffMediaPerPage?: number;

    /**
     * `charactersSort` is an array of strings representing the sort order for characters; `CharacterSort` values.
     */
    charactersSort?: string[];

    /**
     * `charactersPage` is a number representing the page number for characters.
     */
    charactersPage?: number;

    /**
     * `charactersPerPage` is a number representing the number of characters per page.
     */
    charactersPerPage?: number;

    /**
     * `characterMediaSort` is an array of strings representing the sort order for character media; `MediaSort` values.
     */
    characterMediaSort?: string[];

    /**
     * `characterMediaOnList` is a boolean representing whether the character media is on the list.
     */
    characterMediaOnList?: boolean;

    /**
     * `characterMediaPage` is a number representing the page number for character media.
     */
    characterMediaPage?: number;

    /**
     * `characterMediaPerPage` is a number representing the number of character media items per page.
     */
    characterMediaPerPage?: number;
}

/**
 * Validation metadata maps variables to runtime types for the `studios` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const StudiosMappings = {
    page: "number",
    perPage: "number",
    id: "number",
    search: "string",
    id_not: "number",
    id_in: "number[]",
    id_not_in: "number[]",
    sort: StudioSortMappings,
    asHtml: "boolean",
    mediaSort: MediaSortMappings,
    mediaIsMain: "boolean",
    mediaOnList: "boolean",
    mediaPage: "number",
    mediaPerPage: "number",
    staffMediaSort: MediaSortMappings,
    staffMediaType: "string",
    staffMediaOnList: "boolean",
    staffMediaPage: "number",
    staffMediaPerPage: "number",
    charactersSort: CharacterSortMappings,
    charactersPage: "number",
    charactersPerPage: "number",
    characterMediaSort: MediaSortMappings,
    characterMediaOnList: "boolean",
    characterMediaPage: "number",
    characterMediaPerPage: "number",
};

/**
 * {@link StudiosQuery} executes the paginated AniList studios query through {@link AniListOperation}.
 * Its public operation is {@link StudiosQuery.studios}.
 * @see https://docs.anilist.co/reference/object/studio
 */
export class StudiosQuery extends AniListOperation {
    /**
     * {@link StudiosQuery.studios} sends a query request to get a page of studios.
     *
     * @param variables - Values from {@link StudiosVariables} for the query; `page` and `perPage` select the
     * slice of results.
     * @returns The {@link StudiosPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/object/studio
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<StudiosPageResponse, K | "pageInfo">`:
     * the always-selected `pageInfo` is part of the narrowed type because the composed document always sends
     * it. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new StudiosQuery().studios({ search: "Bones", page: 1 });
     * ```
     */
    async studios(
        variables: StudiosVariables,
        options?: RequestOptions
    ): Promise<StudiosPageResponse>;
    async studios(
        variables: StudiosVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<StudiosPageResponse>;
    async studios<K extends FieldPath<StudiosPageResponse>>(
        variables: StudiosVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<StudiosPageResponse, K | "pageInfo">>;
    async studios(
        variables: StudiosVariables,
        options?: RequestOptions & FieldsSelection<StudiosPageResponse>
    ): FieldsResult<StudiosPageResponse, "pageInfo"> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [StudioSort], $asHtml: Boolean, $mediaSort: [MediaSort], $mediaIsMain: Boolean, $mediaOnList: Boolean, $mediaPage: Int, $mediaPerPage: Int, $staffMediaSort: [MediaSort], $staffMediaType: MediaType, $staffMediaOnList: Boolean, $staffMediaPage: Int, $staffMediaPerPage: Int, $charactersSort: [CharacterSort], $charactersPage: Int, $charactersPerPage: Int, $characterMediaSort: [MediaSort], $characterMediaOnList: Boolean, $characterMediaPage: Int, $characterMediaPerPage: Int) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          studios (id: $id, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
            ${StudioSchema}
          }
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<StudiosPageResponse>(
            composeDocument(query, fields, PAGE_ALWAYS),
            variables,
            {
                mappings: StudiosMappings,
                transportOptions,
            }
        );
    }
}
