import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { StaffResponse, StaffSchema } from '../../interfaces/responses/query/Staff'

interface StaffsVariables {
  page?: number
  perPage?: number
  id?: number
  isBirthday?: boolean
  search?: string
  id_not?: number
  id_in?: number[]
  id_not_in?: number[]
  sort?: string[]
  asHtml?: boolean
  staffMediaSort?: string[]
  staffMediaType?: string
  staffMediaOnList?: boolean
  staffMediaPage?: number
  staffMediaPerPage?: number
  charactersSort?: string[]
  charactersPage?: number
  charactersPerPage?: number
  characterMediaSort?: string[]
  characterMediaOnList?: boolean
  characterMediaPage?: number
  characterMediaPerPage?: number
}

export class StaffsQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async staffs (variables?: StaffsVariables): Promise<StaffResponse> {
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