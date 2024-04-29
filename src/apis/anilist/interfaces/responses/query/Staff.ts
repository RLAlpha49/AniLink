import { Name, NameSchema } from '../../Name'
import { Image, ImageSchema } from '../../Image'
import { FuzzyDate, FuzzyDateSchema } from '../../FuzzyDate'
import { Title, TitleSchema } from '../../Title'

/**
 * `NotificationSchema` is a constant representing the GraphQL schema for a notification query.
 * It includes various types of notifications such as AiringNotification, FollowingNotification, ActivityMessageNotification, ActivityMentionNotification, ActivityReplyNotification, ActivityReplySubscribedNotification, ActivityLikeNotification, ActivityReplyLikeNotification, ThreadCommentMentionNotification, ThreadCommentReplyNotification, ThreadCommentSubscribedNotification, ThreadCommentLikeNotification, ThreadLikeNotification, RelatedMediaAdditionNotification, MediaDataChangeNotification, MediaMergeNotification, and MediaDeletionNotification.
 */
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
