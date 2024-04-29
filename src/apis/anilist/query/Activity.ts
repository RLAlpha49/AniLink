import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { Activity, ActivityWithRepliesSchema } from '../interfaces/Activity'

export interface ActivityVariables {
  id?: number
  userId?: number
  messengerId?: number
  mediaId?: number
  type?: string
  isFollowing?: boolean
  hasReplies?: boolean
  hasRepliesOrTypeText?: boolean
  createdAt?: number
  id_not?: number
  id_in?: number[]
  id_not_in?: number[]
  userId_not?: number
  userId_in?: number[]
  userId_not_in?: number[]
  messengerId_not?: number
  messengerId_in?: number[]
  messengerId_not_in?: number[]
  mediaId_not?: number
  mediaId_in?: number[]
  mediaId_not_in?: number[]
  type_not?: string
  type_in?: string[]
  type_not_in?: string[]
  createdAt_greater?: number
  sort?: string[]
  asHtml?: boolean
}

export class ActivityQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async activity (variables?: ActivityVariables): Promise<Activity> {
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
