import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import {
  MediaListCollectionQuerySchema,
  type MediaListCollectionResponse
} from '../interfaces/responses/query/MediaListCollectionResponse'

/**
 * `MediaListCollectionVariables` is an interface representing the variables for the `MediaListCollectionQuery`.
 * It includes optional parameters for querying media list collection data.
 */
export interface MediaListCollectionVariables {
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
   * `forceSingleCompletedList` is a boolean indicating whether to force a single completed list.
   */
  forceSingleCompletedList?: boolean

  /**
   * `chunk` is a number representing the chunk of the media list collection.
   */
  chunk?: number

  /**
   * `perChunk` is a number representing the number of media per chunk.
   */
  perChunk?: number

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
 * `MediaListCollectionQuery` is a class representing a query for media list collection data.
 * It includes a method to send the media list collection query and receive the response.
 */
export class MediaListCollectionQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `MediaListCollectionQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `mediaListCollection` is a method that sends a query request to get media list collection data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async mediaListCollection (variables?: MediaListCollectionVariables): Promise<MediaListCollectionResponse> {
    const query = MediaListCollectionQuerySchema

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
