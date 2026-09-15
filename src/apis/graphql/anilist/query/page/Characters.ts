import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type CharactersPageResponse } from "../../interfaces/responses/page/Characters";
import { CharacterSortMappings, MediaSortMappings } from "../../types/Sort";
import { CharacterSchema } from "../../schemas/responses/query/Character";
import { composeDocument } from "../../schemas/selection/composeSelection";
import { PAGE_ALWAYS, splitFieldsOption } from "../../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../../schemas/selection/fieldsSelection";

/**
 * {@link CharactersVariables} contains variables for the {@link CharactersQuery} operation.
 *
 * See {@link CharactersQuery} and {@link CharactersPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/character
 */
export interface CharactersVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

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
     * `id_not` is a number representing the id that should not be included.
     */
    id_not?: number;

    /**
     * `id_in` is an array of numbers representing the ids that should be included.
     */
    id_in?: number[];

    /**
     * `id_not_in` is an array of numbers representing the ids that should not be included.
     */
    id_not_in?: number[];

    /**
     * `sort` is an array of strings representing the sort order; `CharacterSort` values.
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
     * `mediaOnList` is a boolean representing whether the media is on the list.
     */
    mediaOnList?: boolean;

    /**
     * `mediaPage` is a number representing the media page number.
     */
    mediaPage?: number;

    /**
     * `mediaPerPage` is a number representing the number of media items per page.
     */
    mediaPerPage?: number;
}

/**
 * Validation metadata maps variables to runtime types for the `characters` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const CharactersMappings = {
    page: "number",
    perPage: "number",
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
 * {@link CharactersQuery} executes the paginated AniList characters query through {@link AniListOperation}.
 * Its public operation is {@link CharactersQuery.characters}.
 * @see https://docs.anilist.co/reference/object/character
 */
export class CharactersQuery extends AniListOperation {
    /**
     * {@link CharactersQuery.characters} sends a query request to get a page of characters.
     *
     * @param variables - Values from {@link CharactersVariables} for the query; `page` and `perPage` select
     * the slice of results.
     * @returns The {@link CharactersPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/object/character
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<CharactersPageResponse, K | "pageInfo">`:
     * the always-selected `pageInfo` is part of the narrowed type because the composed document always sends
     * it. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new CharactersQuery().characters({ page: 1, perPage: 10 });
     * ```
     */
    async characters(
        variables: CharactersVariables,
        options?: RequestOptions
    ): Promise<CharactersPageResponse>;
    async characters(
        variables: CharactersVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<CharactersPageResponse>;
    async characters<K extends FieldPath<CharactersPageResponse>>(
        variables: CharactersVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<CharactersPageResponse, K | "pageInfo">>;
    async characters(
        variables: CharactersVariables,
        options?: RequestOptions & FieldsSelection<CharactersPageResponse>
    ): FieldsResult<CharactersPageResponse, "pageInfo"> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $isBirthday: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [CharacterSort], $asHtml: Boolean, $mediaSort: [MediaSort], $mediaOnList: Boolean, $mediaPage: Int, $mediaPerPage: Int) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          characters (id: $id, isBirthday: $isBirthday, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
            ${CharacterSchema}
          }
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<CharactersPageResponse>(
            composeDocument(query, fields, PAGE_ALWAYS),
            variables,
            {
                mappings: CharactersMappings,
                transportOptions,
            }
        );
    }
}
