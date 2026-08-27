import { BasicUserSchema } from "../../Basic";
import { MediaSchema } from "./Media";

/**
 * {@link RecommendationSchema} is a constant representing the GraphQL schema for a recommendation query.
 * It includes the id, rating, user rating, media of type `MediaResponse`, media recommendation of type `MediaResponse`, and user of type `BasicUser`.
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
