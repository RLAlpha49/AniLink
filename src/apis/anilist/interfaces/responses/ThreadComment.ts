import { ThreadResponse, ThreadSchema } from './Thread'
import { BasicUser, BasicUserSchema } from '../BasicUser'

export interface ThreadCommentResponse {
  id: number
  userId: number
  threadId: number
  comment: string
  likeCount: number
  isLiked: boolean
  siteUrl: string
  createdAt: number
  updatedAt: number
  thread: ThreadResponse
  user: BasicUser
  likes: BasicUser[]
  childComments: ThreadCommentResponse[]
  isLocked: boolean
}

export const ThreadCommentSchema = `
  id
  userId
  threadId
  comment (asHtml: $asHtml)
  likeCount
  isLiked
  siteUrl
  createdAt
  updatedAt
  thread {
    ${ThreadSchema}
  }
  user {
    ${BasicUserSchema}
  }
  likes {
    ${BasicUserSchema}
  }
  childComments
  isLocked
`
