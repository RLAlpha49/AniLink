import { MediaResponse, MediaSchema } from './Media'
import { BasicUser, BasicUserSchema } from '../BasicUser'

export interface ThreadResponse {
  id: number
  title: string
  body: string
  userId: number
  replyUserId: number
  replyCommentId: number
  replyCount: number
  viewCount: number
  isLocked: boolean
  isSticky: boolean
  isSubscribed: boolean
  likeCount: number
  isLiked: boolean
  repliedAt: number
  createdAt: number
  updatedAt: number
  user: BasicUser
  replyUser: BasicUser
  likes: BasicUser[]
  siteUrl: string
  categories: Array<{
    id: number
    name: string
  }>
  mediaCategories: MediaResponse[]
}

export const ThreadSchema = `
  id
  title
  body (asHtml: $asHtml)
  userId
  replyUserId
  replyCommentId
  replyCount
  viewCount
  isLocked
  isSticky
  isSubscribed
  likeCount
  isLiked
  repliedAt
  createdAt
  updatedAt
  user {
    ${BasicUserSchema}
  }
  replyUser {
    ${BasicUserSchema}
  }
  likes {
    ${BasicUserSchema}
  }
  siteUrl
  categories {
    id
    name
  }
  mediaCategories {
    ${MediaSchema}
  }
`
