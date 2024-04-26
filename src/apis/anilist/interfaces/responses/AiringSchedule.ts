import { Media } from '../Media'

export interface AiringScheduleResponse {
  id: number
  airingAt: number
  timeUntilAiring: number
  episode: number
  mediaId: number
  media: Media
}
