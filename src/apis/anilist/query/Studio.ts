import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { StudioResponse, StudioSchema } from '../interfaces/responses/Studio'

interface StudioVariables {
  id?: number
  search?: string
  id_not?: number
  id_in?: number[]
  id_not_in?: number[]
  sort?: string[]
  asHtml?: boolean
  mediaSort?: string[]
  mediaIsMain?: boolean
  mediaOnList?: boolean
  mediaPage?: number
  mediaPerPage?: number
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

export class StudioQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async studio (variables?: StudioVariables): Promise<StudioResponse> {
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
