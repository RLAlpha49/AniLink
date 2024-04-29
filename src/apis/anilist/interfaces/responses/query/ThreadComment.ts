import { ThreadResponse, ThreadSchema } from './Thread'
import { BasicUser, BasicUserSchema } from '../../BasicUser'

/**
 * `ThreadCommentResponse` is an interface representing the response from a thread comment query.
 *
 * @property `id` is a number representing the id of the thread comment.
 * @property `userId` is a number representing the id of the user who made the comment.
 * @property `threadId` is a number representing the id of the thread where the comment was made.
 * @property `comment` is a string representing the content of the comment.
 * @property `likeCount` is a number representing the number of likes the comment has received.
 * @property `isLiked` is a boolean indicating whether the comment is liked by the user.
 * @property `siteUrl` is a string representing the URL of the comment on the site.
 * @property `createdAt` is a number representing the timestamp when the comment was created.
 * @property `updatedAt` is a number representing the timestamp when the comment was last updated.
 * @property `thread` is an instance of `ThreadResponse` representing the thread where the comment was made.
 * @property `user` is an instance of `BasicUser` representing the user who made the comment.
 * @property `likes` is an array of `BasicUser` representing the users who liked the comment.
 * @property `childComments` is an array of `ThreadCommentResponse` representing the child comments of the comment.
 * @property `isLocked` is a boolean indicating whether the comment is locked.
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
