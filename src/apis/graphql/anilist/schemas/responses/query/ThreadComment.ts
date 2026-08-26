import { BasicUserSchema } from "../../Basic";
import { ThreadSchema } from "./Thread";

/**
 * `ThreadCommentSchema` is a constant representing the GraphQL schema for a thread comment query.
 * It includes the comment's id, userId, threadId, comment, likeCount, isLiked status, siteUrl, createdAt, updatedAt, thread of type `ThreadResponse`, user of type `BasicUser`, likes of type `BasicUser[]`, childComments, and isLocked status.
 * @see https://docs.anilist.co/reference/object/threadcomment
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
`;
