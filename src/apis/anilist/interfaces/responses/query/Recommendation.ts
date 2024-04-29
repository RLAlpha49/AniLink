import { BasicUser, BasicUserSchema } from '../../BasicUser'
import { MediaResponse, MediaSchema } from './Media'

/**
 * `RecommendationResponse` is an interface representing the response from a recommendation query.
 * It includes the id, rating, user rating, media of type `MediaResponse`, media recommendation of type `MediaResponse`, and user of type `BasicUser`.
 */
export interface RecommendationResponse {
  id: number
  rating: number
  userRating: number
  media: MediaResponse
  mediaRecommendation: MediaResponse
  user: BasicUser
}

/**
 * `RecommendationSchema` is a constant representing the GraphQL schema for a recommendation query.
 * It includes the id, rating, user rating, media of type `MediaResponse`, media recommendation of type `MediaResponse`, and user of type `BasicUser`.
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
`
