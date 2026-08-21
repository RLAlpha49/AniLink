import { BasicUserSchema } from "../../Basic";
import { MediaSchema } from "./Media";

/**
 * `ReviewSchema` is a constant representing the GraphQL schema for a review query.
 * It includes the id, mediaId, userId, mediaType, summary, body, rating, ratingAmount, score, private status, siteUrl, createdAt, updatedAt, user of type `BasicUser`, and media of type `Media`.
 * @see https://docs.anilist.co/reference/object/review
 */
export const ReviewSchema = `
  id
  mediaId
  userId
  mediaType
  summary
  body (asHtml: $asHtml)
  rating
  ratingAmount
  score
  private
  siteUrl
  createdAt
  updatedAt
  user {
    ${BasicUserSchema}
  }
  media {
    ${MediaSchema}
  }
`;
