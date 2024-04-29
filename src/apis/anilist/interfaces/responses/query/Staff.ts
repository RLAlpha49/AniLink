import { Name, NameSchema } from '../../Name'
import { Image, ImageSchema } from '../../Image'
import { FuzzyDate, FuzzyDateSchema } from '../../FuzzyDate'
import { Title, TitleSchema } from '../../Title'

/**
 * `StaffResponse` is an interface representing the response from a staff query.
 * It includes the staff's id, name, language, image, description, primary occupations, gender, date of birth, date of death, age, years active, hometown, blood type, favourite status, favourite blocked status, site url, staff media, characters, character media, staff, submitter, submission status, submission notes, favourites, and mod notes.
 */
export interface StaffResponse {
  /**
   * `id` is a number representing the id of the staff.
   */
  id: number

  /**
   * `name` is an instance of `Name` representing the name of the staff.
   */
  name: Name

  /**
   * `languageV2` is a string representing the language of the staff.
   */
  languageV2: string

  /**
   * `image` is an instance of `Image` representing the image of the staff.
   */
  image: Image

  /**
   * `description` is a string representing the description of the staff.
   */
  description: string

  /**
   * `primaryOccupations` is an array of strings representing the primary occupations of the staff.
   */
  primaryOccupations: string[]

  /**
   * `gender` is a string representing the gender of the staff.
   */
  gender: string

  /**
   * `dateOfBirth` is an instance of `FuzzyDate` representing the date of birth of the staff.
   */
  dateOfBirth: FuzzyDate

  /**
   * `dateOfDeath` is an instance of `FuzzyDate` representing the date of death of the staff.
   */
  dateOfDeath: FuzzyDate

  /**
   * `age` is a number representing the age of the staff.
   */
  age: number

  /**
   * `yearsActive` is an array of numbers representing the years the staff has been active.
   */
  yearsActive: number[]

  /**
   * `homeTown` is a string representing the hometown of the staff.
   */
  homeTown: string

  /**
   * `bloodType` is a string representing the blood type of the staff.
   */
  bloodType: string

  /**
   * `isFavourite` is a boolean indicating whether the staff is a favourite.
   */
  isFavourite: boolean

  /**
   * `isFavouriteBlocked` is a boolean indicating whether the favourite status of the staff is blocked.
   */
  isFavouriteBlocked: boolean

  /**
   * `siteUrl` is a string representing the URL of the staff on the site.
   */
  siteUrl: string

  /**
   * `staffMedia` is an object representing the media associated with the staff.
   * It includes an array of `nodes` each representing a media node with its own properties.
   */
  staffMedia: {
    nodes: Array<{
      /**
       * `id` is a number representing the id of the media node.
       */
      id: number

      /**
       * `title` is an instance of `Title` representing the title of the media node.
       */
      title: Title
    }>
  }

  /**
   * `characters` is an object representing the characters associated with the staff.
   * It includes an array of `nodes` each representing a character node with its own properties.
   */
  characters: {
    nodes: Array<{
      /**
       * `id` is a number representing the id of the character node.
       */
      id: number

      /**
       * `name` is an instance of `Name` representing the name of the character node.
       */
      name: Name
    }>
  }

  /**
   * `characterMedia` is an object representing the media associated with the characters of the staff.
   * It includes an array of `nodes` each representing a media node with its own properties.
   */
  characterMedia: {
    nodes: Array<{
      /**
       * `id` is a number representing the id of the media node.
       */
      id: number

      /**
       * `title` is an instance of `Title` representing the title of the media node.
       */
      title: Title
    }>
  }

  /**
   * `staff` is an object representing the staff associated with the staff response.
   * It includes the staff's id and name.
   */
  staff: {
    /**
     * `id` is a number representing the id of the staff.
     */
    id: number

    /**
     * `name` is an instance of `Name` representing the name of the staff.
     */
    name: Name
  }

  /**
   * `submitter` is an object representing the submitter of the staff response.
   * It includes the submitter's id and name.
   */
  submitter: {
    /**
     * `id` is a number representing the id of the submitter.
     */
    id: number

    /**
     * `name` is a string representing the name of the submitter.
     */
    name: string
  }

  /**
   * `submissionStatus` is a number representing the submission status of the staff response.
   */
  submissionStatus: number

  /**
   * `submissionNotes` is a string representing the submission notes of the staff response.
   */
  submissionNotes: string

  /**
   * `favourites` is a number representing the count of favourites for the staff.
   */
  favourites: number

  /**
   * `modNotes` is a string representing the mod notes for the staff.
   */
  modNotes: string
}

/**
 * `StaffSchema` is a constant representing the GraphQL schema for a staff query.
 * It includes the staff's id, name, language, image, description, primary occupations, gender, date of birth, date of death, age, years active, hometown, blood type, favourite status, favourite blocked status, site url, staff media, characters, character media, staff, submitter, submission status, submission notes, favourites, and mod notes.
 */
export const StaffSchema = `
  id
  ${NameSchema}
  languageV2
  ${ImageSchema}
  description(asHtml: $asHtml)
  primaryOccupations
  gender
  dateOfBirth {
    ${FuzzyDateSchema}
  }
  dateOfDeath {
    ${FuzzyDateSchema}
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
      ${TitleSchema}
    }
  }
  characters (sort: $charactersSort, page: $charactersPage, perPage: $charactersPerPage) {
    nodes {
      id
      ${NameSchema}
    }
  }
  characterMedia (sort: $characterMediaSort, onList: $characterMediaOnList, page: $characterMediaPage, perPage: $characterMediaPerPage) {
    nodes {
      id
      ${TitleSchema}
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
`
