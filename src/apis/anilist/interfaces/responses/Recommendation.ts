import {BasicUser, BasicUserSchema} from "../BasicUser";
import {MediaResponse, MediaSchema} from "./Media";

export interface RecommendationResponse {
  id: number
  rating: number
  userRating: number
  media: MediaResponse
  mediaRecommendation: MediaResponse
  user: BasicUser
}

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