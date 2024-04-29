import { MediaResponse, MediaSchema } from './Media'
import { BasicUser, BasicUserSchema } from '../../BasicUser'

/**
 * `ThreadResponse` is an interface representing the response from a thread query.
 * It includes the thread's id, title, body, userId, replyUserId, replyCommentId, replyCount, viewCount, isLocked status, isSticky status, isSubscribed status, likeCount, isLiked status, repliedAt, createdAt, updatedAt, user of type `BasicUser`, replyUser of type `BasicUser`, likes of type `BasicUser[]`, siteUrl, categories, and mediaCategories of type `MediaResponse[]`.
 */
export interface ThreadResponse {
  id: number
  title: string
  body: string
  userId: number
  replyUserId: number
  replyCommentId: number
  replyCount: number
  viewCount: number
  isLocked: boolean
  isSticky: boolean
  isSubscribed: boolean
  likeCount: number
  isLiked: boolean
  repliedAt: number
  createdAt: number
  updatedAt: number
  user: BasicUser
  replyUser: BasicUser
  likes: BasicUser[]
  siteUrl: string
  categories: Array<{
    id: number
    name: string
  }>
  mediaCategories: MediaResponse[]
}

/**
 * `ThreadSchema` is a constant representing the GraphQL schema for a thread query.
 * It includes the thread's id, title, body, userId, replyUserId, replyCommentId, replyCount, viewCount, isLocked status, isSticky status, isSubscribed status, likeCount, isLiked status, repliedAt, createdAt, updatedAt, user of type `BasicUser`, replyUser of type `BasicUser`, likes of type `BasicUser[]`, siteUrl, categories, and mediaCategories of type `MediaResponse[]`.
 */
export const ThreadSchema = `
  id
  title
  body (asHtml: $asHtml)
  userId
  replyUserId
  replyCommentId
  replyCount
  viewCount
  isLocked
  isSticky
  isSubscribed
  likeCount
  isLiked
  repliedAt
  createdAt
  updatedAt
  user {
    ${BasicUserSchema}
  }
  replyUser {
    ${BasicUserSchema}
  }
  likes {
    ${BasicUserSchema}
  }
  siteUrl
  categories {
    id
    name
  }
  mediaCategories {
    ${MediaSchema}
  }
`
