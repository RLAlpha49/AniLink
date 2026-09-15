import { BasicUserSchema } from "../../Basic";
import { MediaSchema } from "./Media";

/**
 * {@link RecommendationSchema} is the recommendation response selection: the recommended
 * media pair, the rating state, and the recommending user. The recommendation queries
 * send it.
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export const RecommendationSchema = `
  id
  rating
  userRating
  media {
    ${MediaSchema}
  }
  mediaRecommendation {
    ${MediaSchema}
  }
  user {
    ${BasicUserSchema}
  }
`;
