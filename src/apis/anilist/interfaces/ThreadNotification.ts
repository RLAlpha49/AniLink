import { BasicThread, BasicThreadSchema } from './BasicThread'
import { BasicComment, BasicCommentSchema } from './BasicComment'
import { BasicUser, BasicUserSchema } from './BasicUser'

/**
 * `ThreadNotification` is an interface representing a thread notification.
 * It includes the id, userId, type, commentId, context, createdAt, thread, comment, and user each having their own properties.
 */
export interface ThreadNotification {
  /**
   * `id` is a number representing the id of the thread notification.
   */
  id: number

  /**
   * `userId` is a number representing the id of the user associated with the thread notification.
   */
  userId: number

  /**
   * `type` is a string representing the type of the thread notification.
   */
  type: string

  /**
   * `commentId` is a number representing the id of the comment associated with the thread notification.
   */
  commentId: number

  /**
   * `context` is a string representing the context of the thread notification.
   */
  context: string

  /**
   * `createdAt` is a number representing the timestamp when the thread notification was created.
   */
  createdAt: number

  /**
   * `thread` is an instance of `BasicThread` representing the thread associated with the thread notification.
   */
  thread: BasicThread

  /**
   * `comment` is an instance of `BasicComment` representing the comment associated with the thread notification.
   */
  comment: BasicComment

  /**
   * `user` is an instance of `BasicUser` representing the user associated with the thread notification.
   */
  user: BasicUser
}

/**
 * `ThreadNotificationSchema` is a string representing the GraphQL schema for a thread notification.
 * It includes the id, userId, type, commentId, context, createdAt, thread, comment, and user.
 */
export const ThreadNotificationSchema = `
  id
  userId
  type
  commentId
  context
  createdAt
  thread {
    ${BasicThreadSchema}
  }
  comment {
    ${BasicCommentSchema}
  }
  user {
    ${BasicUserSchema}
  }
`
