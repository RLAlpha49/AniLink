import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { type StaffResponse, StaffSchema } from '../../interfaces/responses/query/Staff'
import {CharacterSortMappings, MediaSortMappings, StaffSortMappings} from "../../types/Sort";
import {MediaTypeMappings} from "../../types/Type";
import {validateVariables} from "../../../../base/ValidateVariables";

/**
 * `StaffsVariables` is an interface representing the variables for the `StaffsQuery`.
 * It includes optional page, per page, id, is birthday, search, id not, id in, id not in, sort, as html, staff media sort, staff media type, staff media on list, staff media page, staff media per page, characters sort, characters page, characters per page, character media sort, character media on list, character media page, and character media per page.
 */
export interface StaffsVariables {
  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number

  /**
   * `id` is a number representing the id of the staff.
   */
  id?: number

  /**
   * `isBirthday` is a boolean representing whether it is the staff's birthday.
   */
  isBirthday?: boolean

  /**
   * `search` is a string representing the search term.
   */
  search?: string

  /**
   * `id_not` is a number representing the id of the staff that should not be included.
   */
  id_not?: number

  /**
   * `id_in` is an array of numbers representing the ids of the staff that should be included.
   */
  id_in?: number[]

  /**
   * `id_not_in` is an array of numbers representing the ids of the staff that should not be included.
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
 * `StaffsQuery` is a class representing a query for staffs.
 * It includes a method to get staffs.
 */
export class StaffsQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `StaffsQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `staffs` is a method that sends a query request to get staffs.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async staffs (variables: StaffsVariables): Promise<StaffResponse> {
    if (!variables) {
      throw new Error('At least one variable must be set')
    }
    const variableTypeMappings = {
      page: 'number',
      perPage: 'number',
      id: 'number',
      isBirthday: 'boolean',
      search: 'String',
      id_not: 'number',
      id_in: 'number[]',
      id_not_in: 'number[]',
      sort: StaffSortMappings,
      asHtml: 'boolean',
      staffMediaSort: MediaSortMappings,
      staffMediaType: MediaTypeMappings,
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
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
