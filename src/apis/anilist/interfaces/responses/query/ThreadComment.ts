import { type ThreadResponse, ThreadSchema } from './Thread'
import { type BasicUser, BasicUserSchema } from '../../Basic'

/**
 * `ThreadCommentResponse` is an interface representing the response from a thread comment query.
 * It includes the comment's id, userId, threadId, comment, likeCount, isLiked status, siteUrl, createdAt, updatedAt, thread of type `ThreadResponse`, user of type `BasicUser`, likes of type `BasicUser[]`, childComments of type `ThreadCommentResponse[]`, and isLocked status.
 */
export interface ThreadCommentResponse {
  /**
   * `id` is a number representing the id of the thread comment.
   */
  id: number

  /**
   * `userId` is a number representing the id of the user who made the comment.
   */
  userId: number

  /**
   * `threadId` is a number representing the id of the thread where the comment was made.
   */
  threadId: number

  /**
   * `comment` is a string representing the content of the comment.
   */
  comment: string

  /**
   * `likeCount` is a number representing the number of likes the comment has received.
   */
  likeCount: number

  /**
   * `isLiked` is a boolean indicating whether the comment is liked by the user.
   */
  isLiked: boolean

  /**
   * `siteUrl` is a string representing the URL of the comment on the site.
   */
  siteUrl: string

  /**
   * `createdAt` is a number representing the timestamp when the comment was created.
   */
  createdAt: number

  /**
   * `updatedAt` is a number representing the timestamp when the comment was last updated.
   */
  updatedAt: number

  /**
   * `thread` is an instance of `ThreadResponse` representing the thread where the comment was made.
   */
  thread: ThreadResponse

  /**
   * `user` is an instance of `BasicUser` representing the user who made the comment.
   */
  user: BasicUser

  /**
   * `likes` is an array of `BasicUser` representing the users who liked the comment.
   */
  likes: BasicUser[]

  /**
   * `childComments` is an array of `ThreadCommentResponse` representing the child comments of the comment.
   */
  childComments: ThreadCommentResponse[]

  /**
   * `isLocked` is a boolean indicating whether the comment is locked.
   */
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
