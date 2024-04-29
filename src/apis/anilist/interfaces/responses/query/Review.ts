import { BasicUser, BasicUserSchema } from '../../BasicUser'
import { Media } from '../../Media'
import { MediaSchema } from './Media'

/**
 * `ReviewResponse` is an interface representing the response from a review query.
 * It includes the id, mediaId, userId, mediaType, summary, body, rating, ratingAmount, score, private status, siteUrl, createdAt, updatedAt, user of type `BasicUser`, and media of type `Media`.
 */
export interface ReviewResponse {
  id: number
  mediaId: number
  userId: number
  mediaType: string
  summary: string
  body: string
  rating: number
  ratingAmount: number
  score: number
  private: boolean
  siteUrl: string
  createdAt: number
  updatedAt: number
  user: BasicUser
  media: Media
}

/**
 * `ReviewSchema` is a constant representing the GraphQL schema for a review query.
 * It includes the id, mediaId, userId, mediaType, summary, body, rating, ratingAmount, score, private status, siteUrl, createdAt, updatedAt, user of type `BasicUser`, and media of type `Media`.
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
`
