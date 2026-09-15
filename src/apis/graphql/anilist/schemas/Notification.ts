import { BasicCommentSchema, BasicThreadSchema, BasicUserSchema } from "./Basic";

/**
 * {@link ThreadNotificationSchema} is the thread-comment-notification selection: the
 * shared fields of the four thread-comment variants, with the thread, the comment, and
 * the acting user expanded.
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
