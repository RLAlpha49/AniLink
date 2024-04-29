import { BasicUser, BasicUserSchema } from '../../BasicUser'
import { Media } from '../../Media'
import { MediaSchema } from './Media'

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
