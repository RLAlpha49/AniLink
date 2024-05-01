import { type BasicUser, BasicUserSchema } from './BasicUser'

/**
 * `ActivityReply` is an interface representing a reply to an activity.
 * It includes the id of the reply, the user id, the activity id, the text of the reply, the like count, the like status, the creation date, the user details, and the likes details.
 */
export interface ActivityReply {
  /**
   * `id` is a number representing the unique identifier of the reply.
   */
  id: number

  /**
   * `userId` is a number representing the unique identifier of the user who made the reply.
   */
  userId: number

  /**
   * `activityId` is a number representing the unique identifier of the activity to which the reply was made.
   */
  activityId: number

  /**
   * `text` is a string representing the text of the reply.
   */
  text: string

  /**
   * `likeCount` is a number representing the count of likes the reply has received.
   */
  likeCount: number

  /**
   * `isLiked` is a boolean representing whether the reply is liked by the user or not.
   */
  isLiked: boolean

  /**
   * `createdAt` is a number representing the Unix timestamp when the reply was created.
   */
  createdAt: number

  /**
   * `user` is an object of type `BasicUser` representing the details of the user who made the reply.
   */
  user: BasicUser

  /**
   * `likes` is an array of `BasicUser` objects representing the details of the users who liked the reply.
   */
  likes: BasicUser[]
}

/**
 * `ActivityReplySchema` is a constant representing the GraphQL schema for an activity reply query.
 * It includes the id of the reply, the user id, the activity id, the text of the reply, the like count, the like status, the creation date, the user details, and the likes details.
 */
export const ActivityReplySchema = `
  id
  userId
  activityId
  text (asHtml: $asHtml)
  likeCount
  isLiked
  createdAt
  user {
    ${BasicUserSchema}
  }
  likes {
    ${BasicUserSchema}
  }
`
