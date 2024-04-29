import { ThreadResponse, ThreadSchema } from './Thread'
import { BasicUser, BasicUserSchema } from '../../BasicUser'

/**
 * `ThreadCommentResponse` is an interface representing the response from a thread comment query.
 * It includes the comment's id, userId, threadId, comment, likeCount, isLiked status, siteUrl, createdAt, updatedAt, thread of type `ThreadResponse`, user of type `BasicUser`, likes of type `BasicUser[]`, childComments of type `ThreadCommentResponse[]`, and isLocked status.
 */
export interface ThreadCommentResponse {
  id: number
  userId: number
  threadId: number
  comment: string
  likeCount: number
  isLiked: boolean
  siteUrl: string
  createdAt: number
  updatedAt: number
  thread: ThreadResponse
  user: BasicUser
  likes: BasicUser[]
  childComments: ThreadCommentResponse[]
  isLocked: boolean
}

/**
 * `ThreadCommentSchema` is a constant representing the GraphQL schema for a thread comment query.
 * It includes the comment's id, userId, threadId, comment, likeCount, isLiked status, siteUrl, createdAt, updatedAt, thread of type `ThreadResponse`, user of type `BasicUser`, likes of type `BasicUser[]`, childComments, and isLocked status.
 */
export const ThreadCommentSchema = `
  id
  userId
  threadId
  comment (asHtml: $asHtml)
  likeCount
  isLiked
  siteUrl
  createdAt
  updatedAt
  thread {
    ${ThreadSchema}
  }
  user {
    ${BasicUserSchema}
  }
  likes {
    ${BasicUserSchema}
  }
  childComments
  isLocked
`
