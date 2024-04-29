import { Media } from '../../Media'
import { FuzzyDateSchema } from '../../FuzzyDate'
import { MediaSchema } from './Media'

/**
 * `MediaListResponse` is an interface representing the response from a media list query.
 * It includes the id, user id, media id, status, score, progress, progress volumes, repeat, priority, private status, notes, hidden from status lists status, custom lists, advanced scores, started at date, completed at date, updated at timestamp, created at timestamp, media, and user.
 */
export interface MediaListResponse {
  id: number
  userId: number
  mediaId: number
  status: string
  score: number
  progress: number
  progressVolumes: number
  repeat: number
  priority: number
  private: boolean
  notes: string
  hiddenFromStatusLists: boolean
  customLists: any
  advancedScores: any
  startedAt: any
  completedAt: any
  updatedAt: number
  createdAt: number
  media: Media
  user: any
}

/**
 * `MediaListSchema` is a constant representing the GraphQL schema for a media list query.
 * It includes the id, user id, media id, status, score, progress, progress volumes, repeat, priority, private status, notes, hidden from status lists status, custom lists, advanced scores, started at date, completed at date, updated at timestamp, created at timestamp, media, and user.
 */
export const MediaListSchema = `
  id
  userId
  mediaId
  status
  score (format: $ScoreFormat)
  progress
  progressVolumes
  repeat
  priority
  private
  notes
  hiddenFromStatusLists
  customLists (asArray: $asArray)
  advancedScores
  startedAt {
    ${FuzzyDateSchema}
  }
  completedAt {
    ${FuzzyDateSchema}
  }
  updatedAt
  createdAt
  media {
    ${MediaSchema}
  }
`
