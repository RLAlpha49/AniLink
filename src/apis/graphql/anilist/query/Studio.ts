import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type StudioResponse } from "../interfaces/responses/query/Studio";
import {
    type CharacterSort,
    CharacterSortMappings,
    type MediaSort,
    MediaSortMappings,
    type StudioSort,
    StudioSortMappings,
} from "../types/Sort";
import { StudioSchema } from "../schemas/responses/query/Studio";

/**
 * {@link StudioVariables} contains variables for the {@link StudioQuery} operation.
 *
 * See {@link StudioQuery} and {@link StudioResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/studio
 */
export interface StudioVariables {
    /**
     * `id` is a number representing the id of the studio.
     */
    id?: number;

    /**
     * `search` is a string representing the search term.
     */
    search?: string;

    /**
     * `id_not` is a number representing the id not to include in the search.
     */
    id_not?: number;

    /**
     * `id_in` is an array of numbers representing the ids to include in the search.
     */
    id_in?: number[];

    /**
     * `id_not_in` is an array of numbers representing the ids not to include in the search.
     */
    id_not_in?: number[];

    /**
     * `sort` is an array of strings representing the sort order of the studio.
     */
    sort?: StudioSort[];

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;

    /**
     * `mediaSort` is an array of strings representing the sort order of the media.
     */
    mediaSort?: MediaSort[];

    /**
     * `mediaIsMain` is a boolean indicating whether the media is main.
     */
    mediaIsMain?: boolean;

    /**
     * `mediaOnList` is a boolean indicating whether the media is on the list.
     */
    mediaOnList?: boolean;

    /**
     * `mediaPage` is a number representing the page number of the media.
     */
    mediaPage?: number;

    /**
     * `mediaPerPage` is a number representing the number of media per page.
     */
    mediaPerPage?: number;

    /**
     * `staffMediaSort` is an array of strings representing the sort order of the staff media.
     */
    staffMediaSort?: MediaSort[];

    /**
     * `staffMediaType` is a string representing the type of the staff media.
     */
    staffMediaType?: string;

    /**
     * `staffMediaOnList` is a boolean indicating whether the staff media is on the list.
     */
    staffMediaOnList?: boolean;

    /**
     * `staffMediaPage` is a number representing the page number of the staff media.
     */
    staffMediaPage?: number;

    /**
     * `staffMediaPerPage` is a number representing the number of staff media per page.
     */
    staffMediaPerPage?: number;

    /**
     * `charactersSort` is an array of strings representing the sort order of the characters.
     */
    charactersSort?: CharacterSort[];

    /**
     * `charactersPage` is a number representing the page number of the characters.
     */
    charactersPage?: number;

    /**
     * `charactersPerPage` is a number representing the number of characters per page.
     */
    charactersPerPage?: number;

    /**
     * `characterMediaSort` is an array of strings representing the sort order of the character media.
     */
    characterMediaSort?: MediaSort[];

    /**
     * `characterMediaOnList` is a boolean indicating whether the character media is on the list.
     */
    characterMediaOnList?: boolean;

    /**
     * `characterMediaPage` is a number representing the page number of the character media.
     */
    characterMediaPage?: number;

    /**
     * `characterMediaPerPage` is a number representing the number of character media per page.
     */
    characterMediaPerPage?: number;
}

/**
 * Validation metadata maps variables to runtime types for the {@link StudioQuery.studio} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const StudioMappings = {
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
 * {@link StudioQuery} executes the AniList studio query through {@link AniListOperation}.
 * Its public operation is {@link StudioQuery.studio}.
 * @see https://docs.anilist.co/reference/object/studio
 */
export class StudioQuery extends AniListOperation {
    /**
     * {@link StudioQuery.studio} sends a query request to get studio data.
     *
     * @param variables - Values from {@link StudioVariables} for the query.
     * @returns The {@link StudioResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/studio
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new StudioQuery().studio({ id: 1 });
     * ```
     */
    async studio(variables: StudioVariables, options?: RequestOptions): Promise<StudioResponse> {
        const query = `
      query ($id: Int, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [StudioSort], $asHtml: Boolean, $mediaSort: [MediaSort], $mediaIsMain: Boolean, $mediaOnList: Boolean, $mediaPage: Int, $mediaPerPage: Int, $staffMediaSort: [MediaSort], $staffMediaType: MediaType, $staffMediaOnList: Boolean, $staffMediaPage: Int, $staffMediaPerPage: Int, $charactersSort: [CharacterSort], $charactersPage: Int, $charactersPerPage: Int, $characterMediaSort: [MediaSort], $characterMediaOnList: Boolean, $characterMediaPage: Int, $characterMediaPerPage: Int) {
        Studio (id: $id, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
          ${StudioSchema}
        }
      }
    `;
        return await this.execute<StudioResponse>(query, variables, {
            mappings: StudioMappings,
            transportOptions: options,
        });
    }
}
