import { Name } from '../Name'
import { Image } from '../Image'
import { FuzzyDate } from '../FuzzyDate'
import { Title } from '../Title'

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
