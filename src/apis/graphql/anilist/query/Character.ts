import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type CharacterResponse } from "../interfaces/responses/query/Character";
import {
    type CharacterSort,
    CharacterSortMappings,
    type MediaSort,
    MediaSortMappings,
} from "../types/Sort";
import { CharacterSchema } from "../schemas/responses/query/Character";

/**
 * {@link CharacterVariables} contains variables for the {@link CharacterQuery} operation.
 *
 * See {@link CharacterQuery} and {@link CharacterResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/character
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
 * The variable type mappings for the {@link CharacterQuery.character} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const CharacterMappings = {
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

/**
 * {@link CharacterQuery} executes the AniList character query through {@link AniListOperation}.
 * Its public operation is {@link CharacterQuery.character}.
 * @see https://docs.anilist.co/reference/object/character
 */
export class CharacterQuery extends AniListOperation {
    /**
     * {@link CharacterQuery.character} sends a query request to get characters.
     *
     * @param variables - Values from {@link CharacterVariables} for the query.
     * @returns The {@link CharacterResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/character
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new CharacterQuery().character({ id: 1 });
     * ```
     */
    async character(
        variables: CharacterVariables,
        options?: RequestOptions
    ): Promise<CharacterResponse> {
        const query = `
      query ($id: Int, $isBirthday: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [CharacterSort], $asHtml: Boolean, $mediaSort: [MediaSort], $mediaOnList: Boolean, $mediaPage: Int, $mediaPerPage: Int) {
        Character (id: $id, isBirthday: $isBirthday, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
          ${CharacterSchema}
        }
      }
    `;
        return await this.execute<CharacterResponse>(query, variables, {
            mappings: CharacterMappings,
            transportOptions: options,
        });
    }
}
