import { type Media } from '../../Media'
import { MediaSchema } from './Media'
import { type BasicUser, BasicUserSchema } from '../../Basic'

/**
 * `ReviewResponse` is an interface representing the response from a review query.
 * It includes the id, mediaId, userId, mediaType, summary, body, rating, ratingAmount, score, private status, siteUrl, createdAt, updatedAt, user of type `BasicUser`, and media of type `Media`.
 */
export interface ReviewResponse {
  /**
   * `id` is a number representing the id of the review.
   */
  id: number

  /**
   * `mediaId` is a number representing the id of the media associated with the review.
   */
  mediaId: number

  /**
   * `userId` is a number representing the id of the user who created the review.
   */
  userId: number

  /**
   * `mediaType` is a string representing the type of media being reviewed.
   */
  mediaType: string

  /**
   * `summary` is a string providing a brief summary of the review.
   */
  summary: string

  /**
   * `body` is a string containing the full text of the review.
   */
  body: string

  /**
   * `rating` is a number representing the rating given in the review.
   */
  rating: number

  /**
   * `ratingAmount` is a number representing the amount of ratings the review has received.
   */
  ratingAmount: number

  /**
   * `score` is a number representing the score given in the review.
   */
  score: number

  /**
   * `private` is a boolean indicating whether the review is private.
   */
  private: boolean

  /**
   * `siteUrl` is a string representing the URL of the review on the site.
   */
  siteUrl: string

  /**
   * `createdAt` is a number representing the timestamp when the review was created.
   */
  createdAt: number

  /**
   * `updatedAt` is a number representing the timestamp when the review was last updated.
   */
  updatedAt: number

  /**
   * `user` is an instance of `BasicUser` representing the user who created the review.
   */
  user: BasicUser

  /**
   * `media` is an instance of `Media` representing the media being reviewed.
   */
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
