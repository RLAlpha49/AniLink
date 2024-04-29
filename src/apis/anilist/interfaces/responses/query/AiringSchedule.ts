import { Media } from '../../Media'
import { MediaSchema } from './Media'

/**
 * `AiringScheduleResponse` is an interface representing the response from an airing schedule query.
 * It includes the id, airing time, time until airing, episode number, media id, and the media itself.
 */
export interface AiringScheduleResponse {
  /**
   * `id` is a number representing the id of the airing schedule.
   */
  id: number

  /**
   * `airingAt` is a number representing the airing time of the airing schedule.
   */
  airingAt: number

  /**
   * `timeUntilAiring` is a number representing the time until the airing of the schedule.
   */
  timeUntilAiring: number

  /**
   * `episode` is a number representing the episode number of the airing schedule.
   */
  episode: number

  /**
   * `mediaId` is a number representing the id of the media associated with the airing schedule.
   */
  mediaId: number

  /**
   * `media` is an instance of `Media` representing the media associated with the airing schedule.
   */
  media: Media
}

/**
 * `AiringScheduleSchema` is a constant representing the GraphQL schema for an airing schedule query.
 * It includes the id, airing time, time until airing, episode number, media id, and the media schema.
 */
export const AiringScheduleSchema = `
  id
  airingAt
  timeUntilAiring
  episode
  mediaId
  media {
    ${MediaSchema}
  }
`
