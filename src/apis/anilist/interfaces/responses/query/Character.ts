import { FuzzyDate, FuzzyDateSchema } from '../../FuzzyDate'
import { Name, NameSchema } from '../../Name'
import { Image, ImageSchema } from '../../Image'
import { Title, TitleSchema } from '../../Title'

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
