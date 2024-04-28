import { BasicUser, BasicUserSchema } from './BasicUser'

export interface ActivityReply {
  id: number
  userId: number
  activityId: number
  text: string
  likeCount: number
  isLiked: boolean
  createdAt: number
  user: BasicUser
  likes: BasicUser[]
}

export const ActivityReplySchema = `
  id
  userId
  activityId
  text (asHtml: $asHtml)
  likeCount
  isLiked
  createdAt
  user {
    ${BasicUserSchema}
  }
  likes {
    ${BasicUserSchema}
  }
`
