import { FuzzyDate } from '../FuzzyDate'
import { Media } from '../Media'
import { UserResponse } from './User'

export interface MediaListCollectionResponse {
  MediaListCollection: {
    lists: Array<{
      entries: Array<{
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
        customLists: boolean[]
        advancedScores: number[]
        startedAt: FuzzyDate
        completedAt: FuzzyDate
        updatedAt: number
        createdAt: number
        media: Media
      }>
      name: string
      isCustomList: boolean
      isSplitCompletedList: boolean
      status: string
    }>
    user: UserResponse
    hasNextChunk: boolean
  }
}
