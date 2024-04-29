import { Media } from '../../Media'
import { MediaSchema } from './Media'

/**
 * `MediaTrendResponse` is an interface representing the response from a media trend query.
 * It includes the media's id, date, trending status, average score, popularity, in progress status, releasing status, episode number, and media of type `Media`.
 */
export interface MediaTrendResponse {
  mediaId: number
  date: number
  trending: number
  averageScore: number
  popularity: number
  inProgress: number
  releasing: boolean
  episode: number
  media: Media
}

/**
 * `MediaTrendSchema` is a constant representing the GraphQL schema for a media trend query.
 * It includes the media's id, date, trending status, average score, popularity, in progress status, releasing status, episode number, and media of type `Media`.
 */
export const MediaTrendSchema = `
  mediaId
  date
  trending
  averageScore
  popularity
  inProgress
  releasing
  episode
  media {
    ${MediaSchema}
  }
`
