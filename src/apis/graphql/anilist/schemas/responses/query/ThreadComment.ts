import { BasicUserSchema } from "../../Basic";
import { ThreadSchema } from "./Thread";

/**
 * {@link ThreadCommentSchema} is the thread-comment response selection: the comment's
 * text, its author, its like state, and the thread it belongs to. The thread-comment
 * queries send it.
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
