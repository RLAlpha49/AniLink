import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { StaffResponse } from '../interfaces/responses/Staff'

interface StaffVariables {
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

export class StaffQuery extends APIWrapper {
  constructor () {
    super('https://graphql.anilist.co')
  }

  async staff (variables?: StaffVariables): Promise<StaffResponse> {
    const query = `
      query ($id: Int, $isBirthday: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [StaffSort], $asHtml: Boolean, $staffMediaSort: [MediaSort], $staffMediaType: MediaType, $staffMediaOnList: Boolean, $staffMediaPage: Int, $staffMediaPerPage: Int, $charactersSort: [CharacterSort], $charactersPage: Int, $charactersPerPage: Int, $characterMediaSort: [MediaSort], $characterMediaOnList: Boolean, $characterMediaPage: Int, $characterMediaPerPage: Int) {
        Staff (id: $id, isBirthday: $isBirthday, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
          id
          name {
            first
            last
            full
            native
            alternative
            userPreferred
          }
          languageV2
          image {
            large
            medium
          }
          description(asHtml: $asHtml)
          primaryOccupations
          gender
          dateOfBirth {
            year
            month
            day
          }
          dateOfDeath {
            year
            month
            day
          }
          age
          yearsActive
          homeTown
          bloodType
          isFavourite
          isFavouriteBlocked
          siteUrl
          staffMedia (sort: $staffMediaSort, type: $staffMediaType, onList: $staffMediaOnList, page: $staffMediaPage, perPage: $staffMediaPerPage) {
            nodes {
              id
              title {
                romaji
                english
                native
                userPreferred
              }
            }
          }
          characters (sort: $charactersSort, page: $charactersPage, perPage: $charactersPerPage) {
            nodes {
              id
              name {
                first
                last
                full
                native
              }
            }
          }
          characterMedia (sort: $characterMediaSort, onList: $characterMediaOnList, page: $characterMediaPage, perPage: $characterMediaPerPage) {
            nodes {
              id
              title {
                romaji
                english
                native
                userPreferred
              }
            }
          }
          submitter {
            id
            name
          }
          submissionStatus
          submissionNotes
          favourites
          modNotes
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data)
  }
}
