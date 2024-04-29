import { FuzzyDate, FuzzyDateSchema } from '../../FuzzyDate'
import { Media } from '../../Media'
import { UserResponse } from './User'
import { MediaSchema } from './Media'

/**
 * `MediaListCollectionResponse` is an interface representing the response from a media list collection query.
 * It includes the media list collection, lists, entries, user, and hasNextChunk status.
 */
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

/**
 * `MediaListCollectionQuerySchema` is a constant representing the GraphQL schema for a media list collection query.
 * It includes the media list collection, lists, entries, user, and hasNextChunk status.
 */
export const MediaListCollectionQuerySchema = `
  query ($userId: Int, $userName: String, $type: MediaType, $status: MediaListStatus, $notes: String, $startedAt: FuzzyDateInt, $completedAt: FuzzyDateInt, $forceSingleCompletedList: Boolean, $chunk: Int, $perChunk: Int, $status_in: [MediaListStatus], $status_not_in: [MediaListStatus], $status_not: MediaListStatus, $notes_like: String, $startedAt_greater: FuzzyDateInt, $startedAt_lesser: FuzzyDateInt, $startedAt_like: String, $completedAt_greater: FuzzyDateInt, $completedAt_lesser: FuzzyDateInt, $completedAt_like: String, $sort: [MediaListSort], $scoreFormat: ScoreFormat, $asArray: Boolean, $asHtml: Boolean) {
    MediaListCollection (userId: $userId, userName: $userName, type: $type, status: $status, notes: $notes, startedAt: $startedAt, completedAt: $completedAt, forceSingleCompletedList: $forceSingleCompletedList, chunk: $chunk, perChunk: $perChunk, status_in: $status_in, status_not_in: $status_not_in, status_not: $status_not, notes_like: $notes_like, startedAt_greater: $startedAt_greater, startedAt_lesser: $startedAt_lesser, startedAt_like: $startedAt_like, completedAt_greater: $completedAt_greater, completedAt_lesser: $completedAt_lesser, completedAt_like: $completedAt_like, sort: $sort) {
      lists {
        entries {
          id
          userId
          mediaId
          status
          score (format: $scoreFormat)
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
        }
        name
        isCustomList
        isSplitCompletedList
        status
      }
      hasNextChunk
    }
  }
`
