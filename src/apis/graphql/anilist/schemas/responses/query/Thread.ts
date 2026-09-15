import { BasicUserSchema } from "../../Basic";
import { MediaSchema } from "./Media";

/**
 * {@link ThreadSchema} is the thread response selection: a forum thread's content, its
 * author and last replier, and its categories. The thread queries send it, and the
 * thread-comment fragment interpolates it for the thread a comment belongs to.
 * @see https://docs.anilist.co/reference/object/thread
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
`;
