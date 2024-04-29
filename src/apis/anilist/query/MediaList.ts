import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { MediaListResponse, MediaListSchema } from '../interfaces/responses/query/MediaList'

interface MediaListVariables {
  id?: number
  userId?: number
  userName?: string
  type?: string
  status?: string
  mediaId?: number
  isFollowing?: boolean
  notes?: string
  startedAt?: number
  completedAt?: number
  compareWithAuthList?: boolean
  userId_in?: number[]
  status_in?: string[]
  status_not_in?: string[]
  status_not?: string
  mediaId_in?: number[]
  mediaId_not_in?: number[]
  notes_like?: string
  startedAt_greater?: number
  startedAt_lesser?: number
  startedAt_like?: string
  completedAt_greater?: number
  completedAt_lesser?: number
  completedAt_like?: string
  sort?: string[]
  scoreFormat?: string
  asArray?: boolean
  asHtml?: boolean
}

export class MediaListQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async mediaList (variables?: MediaListVariables): Promise<MediaListResponse> {
    const query = `
      query ($id: Int, $userId: Int, $userName: String, $type: MediaType, $status: MediaListStatus, $mediaId: Int, $isFollowing: Boolean, $notes: String, $startedAt: FuzzyDateInt, $completedAt: FuzzyDateInt, $compareWithAuthList: Boolean, $userId_in: [Int], $status_in: [MediaListStatus], $status_not_in: [MediaListStatus], $status_not: MediaListStatus, $mediaId_in: [Int], $mediaId_not_in: [Int], $notes_like: String, $startedAt_greater: FuzzyDateInt, $startedAt_lesser: FuzzyDateInt, $startedAt_like: String, $completedAt_greater: FuzzyDateInt, $completedAt_lesser: FuzzyDateInt, $completedAt_like: String, $ScoreFormat: ScoreFormat, $asArray: Boolean, $asHtml: Boolean) {
        MediaList (id: $id, userId: $userId, userName: $userName, type: $type, status: $status, mediaId: $mediaId, isFollowing: $isFollowing, notes: $notes, startedAt: $startedAt, completedAt: $completedAt, compareWithAuthList: $compareWithAuthList, userId_in: $userId_in, status_in: $status_in, status_not_in: $status_not_in, status_not: $status_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, notes_like: $notes_like, startedAt_greater: $startedAt_greater, startedAt_lesser: $startedAt_lesser, startedAt_like: $startedAt_like, completedAt_greater: $completedAt_greater, completedAt_lesser: $completedAt_lesser, completedAt_like: $completedAt_like) {
          ${MediaListSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
