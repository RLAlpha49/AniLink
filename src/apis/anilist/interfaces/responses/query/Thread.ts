import { type MediaResponse, MediaSchema } from './Media'
import { type BasicUser, BasicUserSchema } from '../../BasicUser'

/**
 * `ThreadResponse` is an interface representing the response from a thread query.
 * It includes the thread's id, title, body, userId, replyUserId, replyCommentId, replyCount, viewCount, isLocked status, isSticky status, isSubscribed status, likeCount, isLiked status, repliedAt, createdAt, updatedAt, user of type `BasicUser`, replyUser of type `BasicUser`, likes of type `BasicUser[]`, siteUrl, categories, and mediaCategories of type `MediaResponse[]`.
 */
export interface ThreadResponse {
  /**
   * `id` is a number representing the id of the thread.
   */
  id: number

  /**
   * `title` is a string representing the title of the thread.
   */
  title: string

  /**
   * `body` is a string representing the body of the thread.
   */
  body: string

  /**
   * `userId` is a number representing the id of the user who created the thread.
   */
  userId: number

  /**
   * `replyUserId` is a number representing the id of the user who replied to the thread.
   */
  replyUserId: number

  /**
   * `replyCommentId` is a number representing the id of the comment that was replied to in the thread.
   */
  replyCommentId: number

  /**
   * `replyCount` is a number representing the number of replies in the thread.
   */
  replyCount: number

  /**
   * `viewCount` is a number representing the number of views the thread has received.
   */
  viewCount: number

  /**
   * `isLocked` is a boolean indicating whether the thread is locked.
   */
  isLocked: boolean

  /**
   * `isSticky` is a boolean indicating whether the thread is sticky.
   */
  isSticky: boolean

  /**
   * `isSubscribed` is a boolean indicating whether the user is subscribed to the thread.
   */
  isSubscribed: boolean

  /**
   * `likeCount` is a number representing the number of likes the thread has received.
   */
  likeCount: number

  /**
   * `isLiked` is a boolean indicating whether the thread is liked by the user.
   */
  isLiked: boolean

  /**
   * `repliedAt` is a number representing the timestamp when the thread was replied to.
   */
  repliedAt: number

  /**
   * `createdAt` is a number representing the timestamp when the thread was created.
   */
  createdAt: number

  /**
   * `updatedAt` is a number representing the timestamp when the thread was last updated.
   */
  updatedAt: number

  /**
   * `user` is an instance of `BasicUser` representing the user who created the thread.
   */
  user: BasicUser

  /**
   * `replyUser` is an instance of `BasicUser` representing the user who replied to the thread.
   */
  replyUser: BasicUser

  /**
   * `likes` is an array of `BasicUser` representing the users who liked the thread.
   */
  likes: BasicUser[]

  /**
   * `siteUrl` is a string representing the URL of the thread on the site.
   */
  siteUrl: string

  /**
   * `categories` is an array of objects, each representing a category associated with the thread.
   * Each category object includes an `id` and a `name`.
   */
  categories: Array<{
    /**
     * `id` is a number representing the id of the category.
     */
    id: number

    /**
     * `name` is a string representing the name of the category.
     */
    name: string
  }>

  /**
   * `mediaCategories` is an array of `MediaResponse` representing the media categories associated with the thread.
   */
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
