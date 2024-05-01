import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { type CharacterResponse, CharacterSchema } from '../../interfaces/responses/query/Character'
import {CharacterSortMappings, MediaSortMappings} from "../../types/Sort";
import {validateVariables} from "../../../../base/ValidateVariables";

/**
 * `CharactersVariables` is an interface representing the variables for the `CharactersQuery`.
 * It includes optional page, per page, id, is birthday, search, id not, id in, id not in, sort, as html, media sort, media on list, media page, and media per page.
 */
export interface CharactersVariables {
  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number

  /**
   * `id` is a number representing the id of the character.
   */
  id?: number

  /**
   * `isBirthday` is a boolean representing whether it is the character's birthday.
   */
  isBirthday?: boolean

  /**
   * `search` is a string representing the search term.
   */
  search?: string

  /**
   * `id_not` is a number representing the id that should not be included.
   */
  id_not?: number

  /**
   * `id_in` is an array of numbers representing the ids that should be included.
   */
  id_in?: number[]

  /**
   * `id_not_in` is an array of numbers representing the ids that should not be included.
   */
  id_not_in?: number[]

  /**
   * `sort` is an array of strings representing the sort order.
   */
  sort?: string[]

  /**
   * `asHtml` is a boolean representing whether to return the result as HTML.
   */
  asHtml?: boolean

  /**
   * `mediaSort` is an array of strings representing the media sort order.
   */
  mediaSort?: string[]

  /**
   * `mediaOnList` is a boolean representing whether the media is on the list.
   */
  mediaOnList?: boolean

  /**
   * `mediaPage` is a number representing the media page number.
   */
  mediaPage?: number

  /**
   * `mediaPerPage` is a number representing the number of media items per page.
   */
  mediaPerPage?: number
}

/**
 * `CharactersQuery` is a class representing a query for characters.
 * It includes a method to get characters.
 */
export class CharactersQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `CharactersQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `characters` is a method that sends a query request to get characters.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async characters (variables: CharactersVariables): Promise<CharacterResponse> {
    if (!variables) {
      throw new Error('At least one variable must be set')
    }
    const variableTypeMappings = {
      page: 'number',
      perPage: 'number',
      id: 'number',
      isBirthday: 'boolean',
      search: 'string',
      id_not: 'number',
      id_in: 'number[]',
      id_not_in: 'number[]',
      sort: CharacterSortMappings,
      asHtml: 'boolean',
      mediaSort: MediaSortMappings,
      mediaOnList: 'boolean',
      mediaPage: 'number',
      mediaPerPage: 'number'
    }

    validateVariables(variables, variableTypeMappings)

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
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
