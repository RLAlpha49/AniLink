import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { CharacterResponse } from '../interfaces/responses/Character'

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

export class CharacterQuery extends APIWrapper {
  constructor () {
    super('https://graphql.anilist.co')
  }

  async character (variables?: CharacterVariables): Promise<CharacterResponse> {
    const query = `
      query ($id: Int, $isBirthday: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $sort: [CharacterSort], $asHtml: Boolean, $mediaSort: [MediaSort], $mediaOnList: Boolean, $mediaPage: Int, $mediaPerPage: Int) {
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
          description(asHtml: $asHtml)
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
          media(sort: $mediaSort, onList: $mediaOnList, page: $mediaPage, perPage: $mediaPerPage) {
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
