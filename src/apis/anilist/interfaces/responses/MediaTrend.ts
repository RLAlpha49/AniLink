import { Media } from '../Media'
import { MediaSchema } from './Media'

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
