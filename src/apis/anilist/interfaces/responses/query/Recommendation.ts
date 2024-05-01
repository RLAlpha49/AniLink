import { type BasicUser, BasicUserSchema } from '../../BasicUser'
import { type MediaResponse, MediaSchema } from './Media'

/**
 * `RecommendationResponse` is an interface representing the response from a recommendation query.
 * It includes the id, rating, user rating, media of type `MediaResponse`, media recommendation of type `MediaResponse`, and user of type `BasicUser`.
 */
export interface RecommendationResponse {
  /**
   * `id` is a number representing the id of the recommendation.
   */
  id: number

  /**
   * `rating` is a number representing the overall rating of the recommendation.
   */
  rating: number

  /**
   * `userRating` is a number representing the user's rating of the recommendation.
   */
  userRating: number

  /**
   * `media` is an instance of `MediaResponse` representing the media being recommended.
   */
  media: MediaResponse

  /**
   * `mediaRecommendation` is an instance of `MediaResponse` representing the media that is being recommended as similar or related.
   */
  mediaRecommendation: MediaResponse

  /**
   * `user` is an instance of `BasicUser` representing the user who made the recommendation.
   */
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
