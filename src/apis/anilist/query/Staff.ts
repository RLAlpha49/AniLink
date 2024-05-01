import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type StaffResponse, StaffSchema } from '../interfaces/responses/query/Staff'

/**
 * `StaffVariables` is an interface representing the variables for the `StaffQuery`.
 * It includes optional parameters for querying staff data.
 */
export interface StaffVariables {
  /**
   * `id` is a number representing the id of the staff.
   */
  id?: number

  /**
   * `isBirthday` is a boolean indicating whether it's the staff's birthday.
   */
  isBirthday?: boolean

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
   * `sort` is an array of strings representing the sort order of the staff.
   */
  sort?: string[]

  /**
   * `asHtml` is a boolean indicating whether to return the result as HTML.
   */
  asHtml?: boolean

  /**
   * `staffMediaSort` is an array of strings representing the sort order of the staff media.
   */
  staffMediaSort?: string[]

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
  charactersSort?: string[]

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
  characterMediaSort?: string[]

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
 * `StaffQuery` is a class representing a query for staff data.
 * It includes a method to send the staff query and receive the response.
 */
export class StaffQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `StaffQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `staff` is a method that sends a query request to get staff data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async staff (variables?: StaffVariables): Promise<StaffResponse> {
    const query = `
      query ($id: Int, $isBirthday: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [StaffSort], $asHtml: Boolean, $staffMediaSort: [MediaSort], $staffMediaType: MediaType, $staffMediaOnList: Boolean, $staffMediaPage: Int, $staffMediaPerPage: Int, $charactersSort: [CharacterSort], $charactersPage: Int, $charactersPerPage: Int, $characterMediaSort: [MediaSort], $characterMediaOnList: Boolean, $characterMediaPage: Int, $characterMediaPerPage: Int) {
        Staff (id: $id, isBirthday: $isBirthday, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
          ${StaffSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
