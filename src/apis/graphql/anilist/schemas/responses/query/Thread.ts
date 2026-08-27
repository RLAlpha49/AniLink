import { BasicUserSchema } from "../../Basic";
import { MediaSchema } from "./Media";

/**
 * {@link ThreadSchema} is a constant representing the GraphQL schema for a thread query.
 * It includes the thread's id, title, body, userId, replyUserId, replyCommentId, replyCount, viewCount, isLocked status, isSticky status, isSubscribed status, likeCount, isLiked status, repliedAt, createdAt, updatedAt, user of type `BasicUser`, replyUser of type `BasicUser`, likes of type `BasicUser[]`, siteUrl, categories, and mediaCategories of type `MediaResponse[]`.
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
