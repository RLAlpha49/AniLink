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
 * `StudioVariables` is an interface representing the variables for the `StudioQuery`.
 * It includes optional parameters for querying studio data.
 * @see https://docs.anilist.co/reference/query
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
 * The variable type mappings for the `studio` operation.
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
 * `StudioQuery` is a class representing a query for studio data.
 * It includes a method to send the studio query and receive the response.
 * @see https://docs.anilist.co/reference/object/studio
 */
export class StudioQuery extends AniListOperation {
    /**
     * `studio` is a method that sends a query request to get studio data.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/studio
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
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
