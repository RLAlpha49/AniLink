import { APIWrapper } from "../APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type StaffResponse } from "../interfaces/responses/query/Staff";
import {
    type CharacterSort,
    CharacterSortMappings,
    type MediaSort,
    MediaSortMappings,
    type StaffSort,
    StaffSortMappings,
} from "../types/Sort";
import { type MediaType, MediaTypeMappings } from "../types/Type";
import { StaffSchema } from "../schemas/responses/query/Staff";

/**
 * `StaffVariables` is an interface representing the variables for the `StaffQuery`.
 * It includes optional parameters for querying staff data.
 * @see https://docs.anilist.co/reference/query
 */
export interface StaffVariables {
    /**
     * `id` is a number representing the id of the staff.
     */
    id?: number;

    /**
     * `isBirthday` is a boolean indicating whether it's the staff's birthday.
     */
    isBirthday?: boolean;

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
     * `sort` is an array of strings representing the sort order of the staff.
     */
    sort?: StaffSort[];

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;

    /**
     * `staffMediaSort` is an array of strings representing the sort order of the staff media.
     */
    staffMediaSort?: MediaSort[];

    /**
     * `staffMediaType` is a string representing the type of the staff media.
     */
    staffMediaType?: MediaType;

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
 * The variable type mappings for the `staff` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const StaffMappings = {
    id: "number",
    isBirthday: "boolean",
    search: "String",
    id_not: "number",
    id_in: "number[]",
    id_not_in: "number[]",
    sort: StaffSortMappings,
    asHtml: "boolean",
    staffMediaSort: MediaSortMappings,
    staffMediaType: MediaTypeMappings,
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
 * `StaffQuery` is a class representing a query for staff data.
 * It includes a method to send the staff query and receive the response.
 * @see https://docs.anilist.co/reference/object/staff
 */
export class StaffQuery extends APIWrapper {
    /**
     * `staff` is a method that sends a query request to get staff data.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/staff
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async staff(variables: StaffVariables, options?: RequestOptions): Promise<StaffResponse> {
        const query = `
      query ($id: Int, $isBirthday: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [StaffSort], $asHtml: Boolean, $staffMediaSort: [MediaSort], $staffMediaType: MediaType, $staffMediaOnList: Boolean, $staffMediaPage: Int, $staffMediaPerPage: Int, $charactersSort: [CharacterSort], $charactersPage: Int, $charactersPerPage: Int, $characterMediaSort: [MediaSort], $characterMediaOnList: Boolean, $characterMediaPage: Int, $characterMediaPerPage: Int) {
        Staff (id: $id, isBirthday: $isBirthday, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
          ${StaffSchema}
        }
      }
    `;
        return await this.execute<StaffResponse>(query, variables, {
            mappings: StaffMappings,
            transportOptions: options,
        });
    }
}
