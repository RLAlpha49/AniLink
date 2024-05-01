import { type FuzzyDate, FuzzyDateSchema } from '../../FuzzyDate'
import { type Name, NameSchema } from '../../Name'
import { type Image, ImageSchema } from '../../Image'
import { type Title, TitleSchema } from '../../Title'

/**
 * `CharacterResponse` is an interface representing the response from a character query.
 * It includes the character's id, name, image, description, gender, date of birth, age, blood type, favourite status, site URL, associated media, number of favourites, and moderator notes.
 */
export interface CharacterResponse {
  /**
   * `id` is a number representing the id of the character.
   */
  id: number

  /**
   * `name` is an instance of `Name` representing the name of the character.
   */
  name: Name

  /**
   * `image` is an instance of `Image` representing the image of the character.
   */
  image: Image

  /**
   * `description` is a string representing the description of the character.
   */
  description: string

  /**
   * `gender` is a string representing the gender of the character.
   */
  gender: string

  /**
   * `dateOfBirth` is an instance of `FuzzyDate` representing the date of birth of the character.
   */
  dateOfBirth: FuzzyDate

  /**
   * `age` is a string representing the age of the character.
   */
  age: string

  /**
   * `bloodType` is a string representing the blood type of the character.
   */
  bloodType: string

  /**
   * `isFavourite` is a boolean representing whether the character is a favourite.
   */
  isFavourite: boolean

  /**
   * `isFavouriteBlocked` is a boolean representing whether the favourite status of the character is blocked.
   */
  isFavouriteBlocked: boolean

  /**
   * `siteUrl` is a string representing the site URL of the character.
   */
  siteUrl: string

  /**
   * `media` is an object that includes an array of nodes, each representing a media associated with the character.
   * Each node includes the id and title of the media.
   */
  media: {
    nodes: Array<{
      /**
       * `id` is a number representing the id of the media.
       */
      id: number

      /**
       * `title` is an instance of `Title` representing the title of the media.
       */
      title: Title
    }>
  }

  /**
   * `favourites` is a number representing the number of favourites of the character.
   */
  favourites: number

  /**
   * `modNotes` is a string representing the moderator notes of the character.
   */
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
