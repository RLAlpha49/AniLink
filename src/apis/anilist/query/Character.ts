import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'

interface CharacterVariables {
  id?: number
  isBirthday?: boolean
  search?: string
  id_not?: number
  id_in?: number[]
  id_not_in?: number[]
  sort?: string[]
  asHtml?: boolean
  mediaSort?: string[]
  mediaOnList?: boolean
  mediaPage?: number
  mediaPerPage?: number
}

interface CharacterResponse {
  id: number
  name: {
    first: string
    last: string
    full: string
    native: string
  }
  image: {
    large: string
    medium: string
  }
  description: string
  gender: string
  dateOfBirth: {
    year: number
    month: number
    day: number
  }
  age: string
  bloodType: string
  isFavourite: boolean
  isFavouriteBlocked: boolean
  siteUrl: string
  media: {
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
  favourites: number
  modNotes: string
}

export class CharacterQuery extends APIWrapper {
  constructor () {
    super('https://graphql.anilist.co')
  }

  async character (variables?: CharacterVariables): Promise<CharacterResponse> {
    const query = `
      query ($id: Int, $isBirthday: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [CharacterSort]) {
        Character (id: $id, isBirthday: $isBirthday, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, sort: $sort) {
          id
          name {
            first
            last
            full
            native
          }
          image {
            large
            medium
          }
          description(asHtml: true)
          gender
          dateOfBirth {
            year
            month
            day
          }
          age
          bloodType
          isFavourite
          isFavouriteBlocked
          siteUrl
          media(sort: $sort, onList: $onList, page: $page, perPage: $perPage) {
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
          favourites
          modNotes
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data)
  }
}
