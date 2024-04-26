import { FuzzyDate } from '../FuzzyDate'
import { Name } from '../Name'
import { Image } from '../Image'
import { Title } from '../Title'

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
