import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { type StudioResponse, StudioSchema } from '../../interfaces/responses/query/Studio'
import { CharacterSortMappings, MediaSortMappings, StudioSortMappings } from '../../types/Sort'
import { validateVariables } from '../../../../base/ValidateVariables'

/**
 * `StudiosVariables` is an interface representing the variables for the `StudiosQuery`.
 * It includes optional page, per page, id, search, id not, id in, id not in, sort, as html, media sort, media is main, media on list, media page, media per page, staff media sort, staff media type, staff media on list, staff media page, staff media per page, characters sort, characters page, characters per page, character media sort, character media on list, character media page, and character media per page.
 */
export interface StudiosVariables {
  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number

  /**
   * `id` is a number representing the id of the studio.
   */
  id?: number

  /**
   * `search` is a string representing the search term.
   */
  search?: string

  /**
   * `id_not` is a number representing the id of the studio that should not be included.
   */
  id_not?: number

  /**
   * `id_in` is an array of numbers representing the ids of the studios that should be included.
   */
  id_in?: number[]

  /**
   * `id_not_in` is an array of numbers representing the ids of the studios that should not be included.
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
   * `mediaSort` is an array of strings representing the sort order for media.
   */
  mediaSort?: string[]

  /**
   * `mediaIsMain` is a boolean representing whether the media is main.
   */
  mediaIsMain?: boolean

  /**
   * `mediaOnList` is a boolean representing whether the media is on the list.
   */
  mediaOnList?: boolean

  /**
   * `mediaPage` is a number representing the page number for media.
   */
  mediaPage?: number

  /**
   * `mediaPerPage` is a number representing the number of media items per page.
   */
  mediaPerPage?: number

  /**
   * `staffMediaSort` is an array of strings representing the sort order for staff media.
   */
  staffMediaSort?: string[]

  /**
   * `staffMediaType` is a string representing the type of the staff media.
   */
  staffMediaType?: string

  /**
   * `staffMediaOnList` is a boolean representing whether the staff media is on the list.
   */
  staffMediaOnList?: boolean

  /**
   * `staffMediaPage` is a number representing the page number for staff media.
   */
  staffMediaPage?: number

  /**
   * `staffMediaPerPage` is a number representing the number of staff media items per page.
   */
  staffMediaPerPage?: number

  /**
   * `charactersSort` is an array of strings representing the sort order for characters.
   */
  charactersSort?: string[]

  /**
   * `charactersPage` is a number representing the page number for characters.
   */
  charactersPage?: number

  /**
   * `charactersPerPage` is a number representing the number of characters per page.
   */
  charactersPerPage?: number

  /**
   * `characterMediaSort` is an array of strings representing the sort order for character media.
   */
  characterMediaSort?: string[]

  /**
   * `characterMediaOnList` is a boolean representing whether the character media is on the list.
   */
  characterMediaOnList?: boolean

  /**
   * `characterMediaPage` is a number representing the page number for character media.
   */
  characterMediaPage?: number

  /**
   * `characterMediaPerPage` is a number representing the number of character media items per page.
   */
  characterMediaPerPage?: number
}

/**
 * `StudiosQuery` is a class representing a query for studios.
 * It includes a method to get studios.
 */
export class StudiosQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `StudiosQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `studios` is a method that sends a query request to get studios.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async studios (variables: StudiosVariables): Promise<StudioResponse> {
    if (!variables) {
      throw new Error('At least one variable must be provided')
    }
    const variableTypeMappings = {
      page: 'number',
      perPage: 'number',
      id: 'number',
      search: 'string',
      id_not: 'number',
      id_in: 'number[]',
      id_not_in: 'number[]',
      sort: StudioSortMappings,
      asHtml: 'boolean',
      mediaSort: MediaSortMappings,
      mediaIsMain: 'boolean',
      mediaOnList: 'boolean',
      mediaPage: 'number',
      mediaPerPage: 'number',
      staffMediaSort: MediaSortMappings,
      staffMediaType: 'string',
      staffMediaOnList: 'boolean',
      staffMediaPage: 'number',
      staffMediaPerPage: 'number',
      charactersSort: CharacterSortMappings,
      charactersPage: 'number',
      charactersPerPage: 'number',
      characterMediaSort: MediaSortMappings,
      characterMediaOnList: 'boolean',
      characterMediaPage: 'number',
      characterMediaPerPage: 'number'
    }

    validateVariables(variables, variableTypeMappings)
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
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
