import { Media } from '../../Media'
import { MediaSchema } from './Media'

export interface AiringScheduleResponse {
  id: number
  airingAt: number
  timeUntilAiring: number
  episode: number
  mediaId: number
  media: Media
}

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
