import { Media } from '../../Media'
import { MediaSchema } from './Media'

/**
 * `MediaTrendResponse` is an interface representing the response from a media trend query.
 * It includes the media's id, date, trending status, average score, popularity, in progress status, releasing status, episode number, and media of type `Media`.
 */
export interface MediaTrendResponse {
  /**
   * `mediaId` is a number representing the id of the media.
   */
  mediaId: number

  /**
   * `date` is a number representing the date of the media trend.
   */
  date: number

  /**
   * `trending` is a number representing the trending status of the media.
   */
  trending: number

  /**
   * `averageScore` is a number representing the average score of the media.
   */
  averageScore: number

  /**
   * `popularity` is a number representing the popularity of the media.
   */
  popularity: number

  /**
   * `inProgress` is a number representing the in progress status of the media.
   */
  inProgress: number

  /**
   * `releasing` is a boolean representing the releasing status of the media.
   */
  releasing: boolean

  /**
   * `episode` is a number representing the episode number of the media.
   */
  episode: number

  /**
   * `media` is an instance of `Media` representing the media associated with the media trend.
   */
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
