import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { MediaListResponse, MediaListSchema } from '../../interfaces/responses/query/MediaList'

/**
 * `MediaListsVariables` is an interface representing the variables for the `MediaListsQuery`.
 * It includes optional page, per page, id, user id, user name, type, status, media id, is following, notes, started at, completed at, compare with auth list, user id in, status in, status not in, status not, media id in, media id not in, notes like, started at greater, started at lesser, started at like, completed at greater, completed at lesser, completed at like, sort, score format, as array, and as html.
 */
export interface MediaListsVariables {
  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number

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
   * `status` is a string representing the status of the media list.
   */
  status?: string

  /**
   * `mediaId` is a number representing the id of the media.
   */
  mediaId?: number

  /**
   * `isFollowing` is a boolean representing whether the user is following the media.
   */
  isFollowing?: boolean

  /**
   * `notes` is a string representing the notes for the media list.
   */
  notes?: string

  /**
   * `startedAt` is a number representing the start date of the media list.
   */
  startedAt?: number

  /**
   * `completedAt` is a number representing the completion date of the media list.
   */
  completedAt?: number

  /**
   * `compareWithAuthList` is a boolean representing whether to compare with the authenticated list.
   */
  compareWithAuthList?: boolean

  /**
   * `userId_in` is an array of numbers representing the user ids that should be included.
   */
  userId_in?: number[]

  /**
   * `status_in` is an array of strings representing the statuses that should be included.
   */
  status_in?: string[]

  /**
   * `status_not_in` is an array of strings representing the statuses that should not be included.
   */
  status_not_in?: string[]

  /**
   * `status_not` is a string representing the status that should not be included.
   */
  status_not?: string

  /**
   * `mediaId_in` is an array of numbers representing the media ids that should be included.
   */
  mediaId_in?: number[]

  /**
   * `mediaId_not_in` is an array of numbers representing the media ids that should not be included.
   */
  mediaId_not_in?: number[]

  /**
   * `notes_like` is a string representing the notes that should be included.
   */
  notes_like?: string

  /**
   * `startedAt_greater` is a number representing the minimum start date.
   */
  startedAt_greater?: number

  /**
   * `startedAt_lesser` is a number representing the maximum start date.
   */
  startedAt_lesser?: number

  /**
   * `startedAt_like` is a string representing the start date that should be included.
   */
  startedAt_like?: string

  /**
   * `completedAt_greater` is a number representing the minimum completion date.
   */
  completedAt_greater?: number

  /**
   * `completedAt_lesser` is a number representing the maximum completion date.
   */
  completedAt_lesser?: number

  /**
   * `completedAt_like` is a string representing the completion date that should be included.
   */
  completedAt_like?: string

  /**
   * `sort` is an array of strings representing the sort order.
   */
  sort?: string[]

  /**
   * `scoreFormat` is a string representing the score format.
   */
  scoreFormat?: string

  /**
   * `asArray` is a boolean representing whether to return the result as an array.
   */
  asArray?: boolean

  /**
   * `asHtml` is a boolean representing whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `MediaListsQuery` is a class representing a query for media lists.
 * It includes a method to get media lists.
 */
export class MediaListsQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `MediaListsQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `mediaLists` is a method that sends a query request to get media lists.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async mediaLists (variables?: MediaListsVariables): Promise<MediaListResponse> {
    const query = `
      query ($page: Int, $perPage: Int, $id: Int, $userId: Int, $userName: String, $type: MediaType, $status: MediaListStatus, $mediaId: Int, $isFollowing: Boolean, $notes: String, $startedAt: FuzzyDateInt, $completedAt: FuzzyDateInt, $compareWithAuthList: Boolean, $userId_in: [Int], $status_in: [MediaListStatus], $status_not_in: [MediaListStatus], $status_not: MediaListStatus, $mediaId_in: [Int], $mediaId_not_in: [Int], $notes_like: String, $startedAt_greater: FuzzyDateInt, $startedAt_lesser: FuzzyDateInt, $startedAt_like: String, $completedAt_greater: FuzzyDateInt, $completedAt_lesser: FuzzyDateInt, $completedAt_like: String, $ScoreFormat: ScoreFormat, $asArray: Boolean, $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          mediaList (id: $id, userId: $userId, userName: $userName, type: $type, status: $status, mediaId: $mediaId, isFollowing: $isFollowing, notes: $notes, startedAt: $startedAt, completedAt: $completedAt, compareWithAuthList: $compareWithAuthList, userId_in: $userId_in, status_in: $status_in, status_not_in: $status_not_in, status_not: $status_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, notes_like: $notes_like, startedAt_greater: $startedAt_greater, startedAt_lesser: $startedAt_lesser, startedAt_like: $startedAt_like, completedAt_greater: $completedAt_greater, completedAt_lesser: $completedAt_lesser, completedAt_like: $completedAt_like) {
            ${MediaListSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
