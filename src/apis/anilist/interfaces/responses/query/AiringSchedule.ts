import { Media } from '../../Media'
import { MediaSchema } from './Media'

/**
 * `AiringScheduleResponse` is an interface representing the response from an airing schedule query.
 * It includes the id, airing time, time until airing, episode number, media id, and the media itself.
 */
export interface AiringScheduleResponse {
  id: number
  airingAt: number
  timeUntilAiring: number
  episode: number
  mediaId: number
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
