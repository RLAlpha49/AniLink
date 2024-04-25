import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'

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

interface StaffResponse {
  id: number
  name: {
    first: string
    last: string
    full: string
    native: string
  }
  languageV2: string
  image: {
    large: string
    medium: string
  }
  description: string
  primaryOccupations: string[]
  gender: string
  dateOfBirth: {
    year: number
    month: number
    day: number
  }
  dateOfDeath: {
    year: number
    month: number
    day: number
  }
  age: number
  yearsActive: number[]
  homeTown: string
  bloodType: string
  isFavourite: boolean
  isFavouriteBlocked: boolean
  siteUrl: string
  staffMedia: {
    nodes: Array<{
      id: number
      title: {
        romaji: string
        english: string
        native: string
        userPreferred: string
      }
    }>
  }
  characters: {
    nodes: Array<{
      id: number
      name: {
        first: string
        last: string
        full: string
        native: string
      }
    }>
  }
  characterMedia: {
    nodes: Array<{
      id: number
      title: {
        romaji: string
        english: string
        native: string
        userPreferred: string
      }
    }>
  }
  staff: {
    id: number
    name: {
      first: string
      last: string
      full: string
      native: string
    }
  }
  submitter: {
    id: number
    name: string
  }
  submissionStatus: number
  submissionNotes: string
  favourites: number
  modNotes: string
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
