import { APIWrapper } from "../../../base/APIWrapper";
import { type CharacterResponse } from "../interfaces/responses/query/Character";
import {
    type CharacterSort,
    CharacterSortMappings,
    type MediaSort,
    MediaSortMappings,
} from "../types/Sort";
import { requireVariables, validateVariables } from "../../../base/ValidateVariables";
import { CharacterSchema } from "../schemas/responses/query/Character";

/**
 * `CharacterVariables` is an interface representing the variables for the `CharacterQuery`.
 * It includes optional id, isBirthday, search, id_not, id_in, id_not_in, sort, asHtml, mediaSort, mediaOnList, mediaPage, and mediaPerPage.
 * @see https://docs.anilist.co/reference/query
 */
export interface CharacterVariables {
    /**
     * `id` is a number representing the id of the character.
     */
    id?: number;

    /**
     * `isBirthday` is a boolean representing whether it is the character's birthday.
     */
    isBirthday?: boolean;

    /**
     * `search` is a string representing the search term.
     */
    search?: string;

    /**
     * `id_not` is a number representing the id of the character that should not be included.
     */
    id_not?: number;

    /**
     * `id_in` is an array of numbers representing the ids of the characters that should be included.
     */
    id_in?: number[];

    /**
     * `id_not_in` is an array of numbers representing the ids of the characters that should not be included.
     */
    id_not_in?: number[];

    /**
     * `sort` is an array of strings representing the sort order.
     */
    sort?: CharacterSort[];

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;

    /**
     * `mediaSort` is an array of strings representing the sort order for media.
     */
    mediaSort?: MediaSort[];

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
}

/**
 * `CharacterQuery` is a class representing a query for characters.
 * It includes a method to get characters.
 * @see https://docs.anilist.co/reference/query
 */
export class CharacterQuery extends APIWrapper {
    /**
     * `character` is a method that sends a query request to get characters.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/query
     */
    async character(variables: CharacterVariables): Promise<CharacterResponse> {
        requireVariables(
            variables,
            {
                kind: "notOnly",
                names: ["asHtml", "mediaSort", "mediaOnList", "mediaPage", "mediaPerPage"],
            },
            "The Character query requires at least one filter variable."
        );
        const variableTypeMappings = {
            id: "number",
            isBirthday: "boolean",
            search: "string",
            id_not: "number",
            id_in: "number[]",
            id_not_in: "number[]",
            sort: CharacterSortMappings,
            asHtml: "boolean",
            mediaSort: MediaSortMappings,
            mediaOnList: "boolean",
            mediaPage: "number",
            mediaPerPage: "number",
        };

        validateVariables(variables, variableTypeMappings);

        const query = `
      query ($id: Int, $isBirthday: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [CharacterSort], $asHtml: Boolean, $mediaSort: [MediaSort], $mediaOnList: Boolean, $mediaPage: Int, $mediaPerPage: Int) {
        Character (id: $id, isBirthday: $isBirthday, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
          ${CharacterSchema}
        }
      }
    `;

        return await this.request(query, variables);
    }
}
