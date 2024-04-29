import { Media } from '../../Media'
import { FuzzyDateSchema } from '../../FuzzyDate'
import { MediaSchema } from './Media'

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
