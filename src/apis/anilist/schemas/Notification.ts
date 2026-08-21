import { BasicCommentSchema, BasicThreadSchema, BasicUserSchema } from "./Basic";

/**
 * `ThreadNotificationSchema` is a string representing the GraphQL schema for a thread notification.
 * It includes the id, userId, type, commentId, context, createdAt, thread, comment, and user.
 * @see https://docs.anilist.co/reference/union/notificationunion
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
`;
