/**
 * `BasicComment` is an interface representing a basic comment.
 * It includes the id, user id, and thread id each having their own properties.
 */
export interface BasicComment {
  /**
   * `id` is a number representing the unique identifier of the comment.
   */
  id: number

  /**
   * `userId` is a number representing the unique identifier of the user who made the comment.
   */
  userId: number

  /**
   * `threadId` is a number representing the unique identifier of the thread where the comment is posted.
   */
  threadId: number
}

/**
 * `BasicCommentSchema` is a string representing the GraphQL schema for a basic comment.
 * It includes the id, user id, and thread id.
 */
export const BasicCommentSchema = `
  id
  userId
  threadId
`
