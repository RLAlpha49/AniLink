import { BasicUserSchema } from "../../Basic";
import { MediaSchema } from "./Media";

/**
 * {@link ReviewSchema} is the review response selection: the review's summary, body, and
 * scores, with its author and media. The review queries send it.
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
