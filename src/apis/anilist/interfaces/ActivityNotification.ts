import { type Activity, ActivitySchema } from './Activity'
import { type BasicUser, BasicUserSchema } from './BasicUser'

/**
 * `ActivityNotification` is an interface representing a notification related to an activity.
 * It includes the id of the notification, the user id, the type of the notification, the activity id, the context, the creation date, the activity details, and the user details.
 */
export interface ActivityNotification {
  /**
   * `id` is a number representing the unique identifier of the notification.
   */
  id: number

  /**
   * `userId` is a number representing the unique identifier of the user associated with the notification.
   */
  userId: number

  /**
   * `type` is a string representing the type of the notification.
   */
  type: string

  /**
   * `activityId` is a number representing the unique identifier of the activity associated with the notification.
   */
  activityId: number

  /**
   * `context` is a string representing the context of the notification.
   */
  context: string

  /**
   * `createdAt` is a number representing the Unix timestamp when the notification was created.
   */
  createdAt: number

  /**
   * `activity` is an object of type `Activity` representing the details of the activity associated with the notification.
   */
  activity: Activity

  /**
   * `user` is an object of type `BasicUser` representing the details of the user associated with the notification.
   */
  user: BasicUser
}

/**
 * `ActivityNotificationSchema` is a constant representing the GraphQL schema for an activity notification query.
 * It includes the id of the notification, the user id, the type of the notification, the activity id, the context, the creation date, the activity details, and the user details.
 */
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
