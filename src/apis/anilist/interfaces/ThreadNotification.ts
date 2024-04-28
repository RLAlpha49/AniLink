import { BasicThread, BasicThreadSchema } from './BasicThread'
import { BasicComment, BasicCommentSchema } from './BasicComment'
import { BasicUser, BasicUserSchema } from './BasicUser'

export interface ThreadNotification {
  id: number
  userId: number
  type: string
  commentId: number
  context: string
  createdAt: number
  thread: BasicThread
  comment: BasicComment
  user: BasicUser

}

export const ThreadNotificationSchema = `
  id
  userId
  type
  commentId
  context
  createdAt
  thread {
    ${BasicThreadSchema}
  }
  comment {
    ${BasicCommentSchema}
  }
  user {
    ${BasicUserSchema}
  }
`
