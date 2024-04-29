import { FuzzyDate, FuzzyDateSchema } from '../../FuzzyDate'
import { Name, NameSchema } from '../../Name'
import { Image, ImageSchema } from '../../Image'
import { Title, TitleSchema } from '../../Title'

/**
 * `CharacterResponse` is an interface representing the response from a character query.
 * It includes the character's id, name, image, description, gender, date of birth, age, blood type, favourite status, site URL, associated media, number of favourites, and moderator notes.
 */
export interface CharacterResponse {
  id: number
  name: Name
  image: Image
  description: string
  gender: string
  dateOfBirth: FuzzyDate
  age: string
  bloodType: string
  isFavourite: boolean
  isFavouriteBlocked: boolean
  siteUrl: string
  media: {
    nodes: Array<{
      id: number
      title: Title
    }>
  }
  favourites: number
  modNotes: string
}

/**
 * `CharacterSchema` is a constant representing the GraphQL schema for a character query.
 * It includes the character's id, name, image, description, gender, date of birth, age, blood type, favourite status, site URL, associated media, number of favourites, and moderator notes.
 */
export const CharacterSchema = `
  id
  ${NameSchema}
  ${ImageSchema}
  description(asHtml: $asHtml)
  gender
  dateOfBirth {
    ${FuzzyDateSchema}
  }
  age
  bloodType
  isFavourite
  isFavouriteBlocked
  siteUrl
  media(sort: $mediaSort, onList: $mediaOnList, page: $mediaPage, perPage: $mediaPerPage) {
    nodes {
      id
      ${TitleSchema}
    }
  }
  favourites
  modNotes
`
