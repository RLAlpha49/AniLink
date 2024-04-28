import { Activity, ActivitySchema } from './Activity'
import { BasicUser, BasicUserSchema } from './BasicUser'

export interface ActivityNotification {
  id: number
  userId: number
  type: string
  activityId: number
  context: string
  createdAt: number
  activity: Activity
  user: BasicUser
}

export const ActivityNotificationSchema = `
  id
  userId
  type
  activityId
  context
  createdAt
  ${ActivitySchema}
    user {
      ${BasicUserSchema}
    }
`
