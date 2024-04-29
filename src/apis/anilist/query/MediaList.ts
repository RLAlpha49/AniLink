import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { MediaListResponse, MediaListSchema } from '../interfaces/responses/query/MediaList'

/**
 * `MediaListVariables` is an interface representing the variables for the `MediaListQuery`.
 * It includes optional parameters for querying media list data.
 */
export interface MediaListVariables {
  /**
   * `id` is a number representing the id of the media list.
   */
  id?: number

  /**
   * `userId` is a number representing the id of the user.
   */
  userId?: number

  /**
   * `userName` is a string representing the name of the user.
   */
  userName?: string

  /**
   * `type` is a string representing the type of the media.
   */
  type?: string

  /**
   * `status` is a string representing the status of the media.
   */
  status?: string

  /**
   * `mediaId` is a number representing the id of the media.
   */
  mediaId?: number

  /**
   * `isFollowing` is a boolean indicating whether the user is following the media.
   */
  isFollowing?: boolean

  /**
   * `notes` is a string representing any notes about the media.
   */
  notes?: string

  /**
   * `startedAt` is a number representing the start date of the media.
   */
  startedAt?: number

  /**
   * `completedAt` is a number representing the completion date of the media.
   */
  completedAt?: number

  /**
   * `compareWithAuthList` is a boolean indicating whether to compare with the authenticated list.
   */
  compareWithAuthList?: boolean

  /**
   * `userId_in` is an array of numbers representing the ids of the users.
   */
  userId_in?: number[]

  /**
   * `status_in` is an array of strings representing the statuses of the media.
   */
  status_in?: string[]

  /**
   * `status_not_in` is an array of strings representing the statuses not included in the media.
   */
  status_not_in?: string[]

  /**
   * `status_not` is a string representing the status not included in the media.
   */
  status_not?: string

  /**
   * `mediaId_in` is an array of numbers representing the ids of the media.
   */
  mediaId_in?: number[]

  /**
   * `mediaId_not_in` is an array of numbers representing the ids not included in the media.
   */
  mediaId_not_in?: number[]

  /**
   * `notes_like` is a string representing the notes similar to the media.
   */
  notes_like?: string

  /**
   * `startedAt_greater` is a number representing the start date greater than the media.
   */
  startedAt_greater?: number

  /**
   * `startedAt_lesser` is a number representing the start date lesser than the media.
   */
  startedAt_lesser?: number

  /**
   * `startedAt_like` is a string representing the start date similar to the media.
   */
  startedAt_like?: string

  /**
   * `completedAt_greater` is a number representing the completion date greater than the media.
   */
  completedAt_greater?: number

  /**
   * `completedAt_lesser` is a number representing the completion date lesser than the media.
   */
  completedAt_lesser?: number

  /**
   * `completedAt_like` is a string representing the completion date similar to the media.
   */
  completedAt_like?: string

  /**
   * `sort` is an array of strings representing the sort order of the media.
   */
  sort?: string[]

  /**
   * `scoreFormat` is a string representing the format of the score of the media.
   */
  scoreFormat?: string

  /**
   * `asArray` is a boolean indicating whether to return the result as an array.
   */
  asArray?: boolean

  /**
   * `asHtml` is a boolean indicating whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `MediaListQuery` is a class representing a query for media list data.
 * It includes a method to send the media list query and receive the response.
 */
export class MediaListQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `MediaListQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `mediaList` is a method that sends a query request to get media list data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
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
