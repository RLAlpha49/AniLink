import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type Activity, ActivityWithRepliesSchema } from '../interfaces/Activity'
import { validateVariables } from '../../../base/ValidateVariables'
import { type ActivitySort, ActivitySortMappings } from '../types/Sort'
import { type ActivityType, ActivityTypeMappings } from '../types/ActivityType'

/**
 * `ActivityVariables` is an interface representing the variables for the `ActivityQuery`.
 * It includes optional id, userId, messengerId, mediaId, type, isFollowing, hasReplies, hasRepliesOrTypeText, createdAt, id_not, id_in, id_not_in, userId_not, userId_in, userId_not_in, messengerId_not, messengerId_in, messengerId_not_in, mediaId_not, mediaId_in, mediaId_not_in, type_not, type_in, type_not_in, createdAt_greater, sort, and asHtml.
 */
export interface ActivityVariables {
  /**
   * `id` is a number representing the id of the activity.
   */
  id: number

  /**
   * `userId` is a number representing the id of the user.
   */
  userId?: number

  /**
   * `messengerId` is a number representing the id of the messenger.
   */
  messengerId?: number

  /**
   * `mediaId` is a number representing the id of the media.
   */
  mediaId?: number

  /**
   * `type` is a string representing the type of the activity.
   */
  type?: ActivityType

  /**
   * `isFollowing` is a boolean representing whether the user is following.
   */
  isFollowing?: boolean

  /**
   * `hasReplies` is a boolean representing whether the activity has replies.
   */
  hasReplies?: boolean

  /**
   * `hasRepliesOrTypeText` is a boolean representing whether the activity has replies or type text.
   */
  hasRepliesOrTypeText?: boolean

  /**
   * `createdAt` is a number representing the creation time of the activity.
   */
  createdAt?: number

  /**
   * `id_not` is a number representing the id of the activity that should not be included.
   */
  id_not?: number

  /**
   * `id_in` is an array of numbers representing the ids of the activities that should be included.
   */
  id_in?: number[]

  /**
   * `id_not_in` is an array of numbers representing the ids of the activities that should not be included.
   */
  id_not_in?: number[]

  /**
   * `userId_not` is a number representing the id of the user that should not be included.
   */
  userId_not?: number

  /**
   * `userId_in` is an array of numbers representing the ids of the users that should be included.
   */
  userId_in?: number[]

  /**
   * `userId_not_in` is an array of numbers representing the ids of the users that should not be included.
   */
  userId_not_in?: number[]

  /**
   * `messengerId_not` is a number representing the id of the messenger that should not be included.
   */
  messengerId_not?: number

  /**
   * `messengerId_in` is an array of numbers representing the ids of the messengers that should be included.
   */
  messengerId_in?: number[]

  /**
   * `messengerId_not_in` is an array of numbers representing the ids of the messengers that should not be included.
   */
  messengerId_not_in?: number[]

  /**
   * `mediaId_not` is a number representing the id of the media that should not be included.
   */
  mediaId_not?: number

  /**
   * `mediaId_in` is an array of numbers representing the ids of the media that should be included.
   */
  mediaId_in?: number[]

  /**
   * `mediaId_not_in` is an array of numbers representing the ids of the media that should not be included.
   */
  mediaId_not_in?: number[]

  /**
   * `type_not` is a string representing the type of the activity that should not be included.
   */
  type_not?: ActivityType

  /**
   * `type_in` is an array of strings representing the types of the activities that should be included.
   */
  type_in?: ActivityType[]

  /**
   * `type_not_in` is an array of strings representing the types of the activities that should not be included.
   */
  type_not_in?: ActivityType[]

  /**
   * `createdAt_greater` is a number representing the minimum creation time of the activities.
   */
  createdAt_greater?: number

  /**
   * `sort` is an array of strings representing the sort order.
   */
  sort?: ActivitySort[]

  /**
   * `asHtml` is a boolean representing whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `ActivityQuery` is a class representing a query for activities.
 * It includes a method to get activities.
 */
export class ActivityQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ActivityQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `activity` is a method that sends a query request to get activities.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async activity (variables: ActivityVariables): Promise<Activity> {
    if (!variables) {
      throw new Error('At least one variable must be set')
    }
    const variableTypeMappings = {
      id: 'number',
      userId: 'number',
      messengerId: 'number',
      mediaId: 'number',
      type: ActivityTypeMappings,
      isFollowing: 'boolean',
      hasReplies: 'boolean',
      hasRepliesOrTypeText: 'boolean',
      createdAt: 'number',
      id_not: 'number',
      id_in: 'number[]',
      id_not_in: 'number[]',
      userId_not: 'number',
      userId_in: 'number[]',
      userId_not_in: 'number[]',
      messengerId_not: 'number',
      messengerId_in: 'number[]',
      messengerId_not_in: 'number[]',
      mediaId_not: 'number',
      mediaId_in: 'number[]',
      mediaId_not_in: 'number[]',
      type_not: ActivityTypeMappings,
      type_in: ActivityTypeMappings,
      type_not_in: ActivityTypeMappings,
      createdAt_greater: 'number',
      sort: ActivitySortMappings,
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($id: Int, $userId: Int, $messengerId: Int, $mediaId: Int, $type: ActivityType, $isFollowing: Boolean, $hasReplies: Boolean, $hasRepliesOrTypeText: Boolean, $createdAt: Int, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $userId_not: Int, $userId_in: [Int], $userId_not_in: [Int], $messengerId_not: Int, $messengerId_in: [Int], $messengerId_not_in: [Int], $mediaId_not: Int, $mediaId_in: [Int], $mediaId_not_in: [Int], $type_not: ActivityType, $type_in: [ActivityType], $type_not_in: [ActivityType], $createdAt_greater: Int, $sort: [ActivitySort], $asHtml: Boolean) {
        Activity (id: $id, userId: $userId, messengerId: $messengerId, mediaId: $mediaId, type: $type, isFollowing: $isFollowing, hasReplies: $hasReplies, hasRepliesOrTypeText: $hasRepliesOrTypeText, createdAt: $createdAt, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, userId_not: $userId_not, userId_in: $userId_in, userId_not_in: $userId_not_in, messengerId_not: $messengerId_not, messengerId_in: $messengerId_in, messengerId_not_in: $messengerId_not_in, mediaId_not: $mediaId_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, type_not: $type_not, type_in: $type_in, type_not_in: $type_not_in, createdAt_greater: $createdAt_greater, sort: $sort) {
          ${ActivityWithRepliesSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
