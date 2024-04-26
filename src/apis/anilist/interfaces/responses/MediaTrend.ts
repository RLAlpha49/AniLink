import { Media } from '../Media'

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
