import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type StaffsPageResponse } from "../../interfaces/responses/page/Staffs";
import { CharacterSortMappings, MediaSortMappings, StaffSortMappings } from "../../types/Sort";
import { MediaTypeMappings } from "../../types/Type";
import { StaffSchema } from "../../schemas/responses/query/Staff";

/**
 * {@link StaffsVariables} contains variables for the {@link StaffsQuery} operation.
 *
 * See {@link StaffsQuery} and {@link StaffsPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/staff
 */
export interface StaffsVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

    /**
     * `id` is a number representing the id of the staff.
     */
    id?: number;

    /**
     * `isBirthday` is a boolean representing whether it is the staff's birthday.
     */
    isBirthday?: boolean;

    /**
     * `search` is a string representing the search term.
     */
    search?: string;

    /**
     * `id_not` is a number representing the id of the staff that should not be included.
     */
    id_not?: number;

    /**
     * `id_in` is an array of numbers representing the ids of the staff that should be included.
     */
    id_in?: number[];

    /**
     * `id_not_in` is an array of numbers representing the ids of the staff that should not be included.
     */
    id_not_in?: number[];

    /**
     * `sort` is an array of strings representing the sort order.
     */
    sort?: string[];

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;

    /**
     * `staffMediaSort` is an array of strings representing the sort order for staff media.
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
     * `charactersSort` is an array of strings representing the sort order for characters.
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
     * `characterMediaSort` is an array of strings representing the sort order for character media.
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
 * Validation metadata maps variables to runtime types for the `staffs` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const StaffsMappings = {
    page: "number",
    perPage: "number",
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
 * {@link StaffsQuery} executes the paginated AniList staff query through {@link AniListOperation}.
 * Its public operation is {@link StaffsQuery.staffs}.
 * @see https://docs.anilist.co/reference/object/staff
 */
export class StaffsQuery extends AniListOperation {
    /**
     * `staffs` is a method that sends a query request to get staffs.
     *
     * @param variables - Values from {@link StaffsVariables} for the query.
     * @returns The {@link StaffsPageResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/staff
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new StaffsQuery().staffs({ search: "Hayao Miyazaki", page: 1 });
     * ```
     */
    async staffs(
        variables: StaffsVariables,
        options?: RequestOptions
    ): Promise<StaffsPageResponse> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $isBirthday: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [StaffSort], $asHtml: Boolean, $staffMediaSort: [MediaSort], $staffMediaType: MediaType, $staffMediaOnList: Boolean, $staffMediaPage: Int, $staffMediaPerPage: Int, $charactersSort: [CharacterSort], $charactersPage: Int, $charactersPerPage: Int, $characterMediaSort: [MediaSort], $characterMediaOnList: Boolean, $characterMediaPage: Int, $characterMediaPerPage: Int) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          staff (id: $id, isBirthday: $isBirthday, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
            ${StaffSchema}
          }
        }
      }
    `;
        return await this.execute<StaffsPageResponse>(query, variables, {
            mappings: StaffsMappings,
            transportOptions: options,
        });
    }
}
