import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type StudioResponse, StudioSchema } from '../interfaces/responses/query/Studio'
import {
  CharacterSort,
  CharacterSortMappings,
  MediaSort,
  MediaSortMappings,
  StudioSort,
  StudioSortMappings
} from "../types/Sort";
import {validateVariables} from "../../../base/ValidateVariables";

/**
 * `StudioVariables` is an interface representing the variables for the `StudioQuery`.
 * It includes optional parameters for querying studio data.
 */
export interface StudioVariables {
  /**
   * `id` is a number representing the id of the studio.
   */
  id?: number

  /**
   * `search` is a string representing the search term.
   */
  search?: string

  /**
   * `id_not` is a number representing the id not to include in the search.
   */
  id_not?: number

  /**
   * `id_in` is an array of numbers representing the ids to include in the search.
   */
  id_in?: number[]

  /**
   * `id_not_in` is an array of numbers representing the ids not to include in the search.
   */
  id_not_in?: number[]

  /**
   * `sort` is an array of strings representing the sort order of the studio.
   */
  sort?: StudioSort[]

  /**
   * `asHtml` is a boolean indicating whether to return the result as HTML.
   */
  asHtml?: boolean

  /**
   * `mediaSort` is an array of strings representing the sort order of the media.
   */
  mediaSort?: MediaSort[]

  /**
   * `mediaIsMain` is a boolean indicating whether the media is main.
   */
  mediaIsMain?: boolean

  /**
   * `mediaOnList` is a boolean indicating whether the media is on the list.
   */
  mediaOnList?: boolean

  /**
   * `mediaPage` is a number representing the page number of the media.
   */
  mediaPage?: number

  /**
   * `mediaPerPage` is a number representing the number of media per page.
   */
  mediaPerPage?: number

  /**
   * `staffMediaSort` is an array of strings representing the sort order of the staff media.
   */
  staffMediaSort?: MediaSort[]

  /**
   * `staffMediaType` is a string representing the type of the staff media.
   */
  staffMediaType?: string

  /**
   * `staffMediaOnList` is a boolean indicating whether the staff media is on the list.
   */
  staffMediaOnList?: boolean

  /**
   * `staffMediaPage` is a number representing the page number of the staff media.
   */
  staffMediaPage?: number

  /**
   * `staffMediaPerPage` is a number representing the number of staff media per page.
   */
  staffMediaPerPage?: number

  /**
   * `charactersSort` is an array of strings representing the sort order of the characters.
   */
  charactersSort?: CharacterSort[]

  /**
   * `charactersPage` is a number representing the page number of the characters.
   */
  charactersPage?: number

  /**
   * `charactersPerPage` is a number representing the number of characters per page.
   */
  charactersPerPage?: number

  /**
   * `characterMediaSort` is an array of strings representing the sort order of the character media.
   */
  characterMediaSort?: MediaSort[]

  /**
   * `characterMediaOnList` is a boolean indicating whether the character media is on the list.
   */
  characterMediaOnList?: boolean

  /**
   * `characterMediaPage` is a number representing the page number of the character media.
   */
  characterMediaPage?: number

  /**
   * `characterMediaPerPage` is a number representing the number of character media per page.
   */
  characterMediaPerPage?: number
}

/**
 * `StudioQuery` is a class representing a query for studio data.
 * It includes a method to send the studio query and receive the response.
 */
export class StudioQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `StudioQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `studio` is a method that sends a query request to get studio data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async studio (variables: StudioVariables): Promise<StudioResponse> {
    if (!variables) {
      throw new Error('At least one variable must be provided')
    }
    const variableTypeMappings = {
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
      query ($id: Int, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [StudioSort], $asHtml: Boolean, $mediaSort: [MediaSort], $mediaIsMain: Boolean, $mediaOnList: Boolean, $mediaPage: Int, $mediaPerPage: Int, $staffMediaSort: [MediaSort], $staffMediaType: MediaType, $staffMediaOnList: Boolean, $staffMediaPage: Int, $staffMediaPerPage: Int, $charactersSort: [CharacterSort], $charactersPage: Int, $charactersPerPage: Int, $characterMediaSort: [MediaSort], $characterMediaOnList: Boolean, $characterMediaPage: Int, $characterMediaPerPage: Int) {
        Studio (id: $id, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
          ${StudioSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
