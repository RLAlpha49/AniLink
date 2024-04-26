import { Media } from '../Media'

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
