import { Name, NameSchema } from '../../Name'
import { Image, ImageSchema } from '../../Image'
import { FuzzyDate, FuzzyDateSchema } from '../../FuzzyDate'
import { Title, TitleSchema } from '../../Title'

export interface StaffResponse {
  id: number
  name: Name
  languageV2: string
  image: Image
  description: string
  primaryOccupations: string[]
  gender: string
  dateOfBirth: FuzzyDate
  dateOfDeath: FuzzyDate
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
      title: Title
    }>
  }
  characters: {
    nodes: Array<{
      id: number
      name: Name
    }>
  }
  characterMedia: {
    nodes: Array<{
      id: number
      title: Title
    }>
  }
  staff: {
    id: number
    name: Name
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
