import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import {
  MediaListCollectionQuerySchema,
  type MediaListCollectionResponse
} from '../interfaces/responses/query/MediaListCollectionResponse'
import { type MediaType, MediaTypeMappings } from '../types/Type'
import { type MediaListStatus, MediaListStatusMappings } from '../types/Status'
import { type FuzzyDateInput, FuzzyDateMappings } from '../types/FuzzyDate'
import { type MediaListSort, MediaListSortMappings } from '../types/Sort'
import { type ScoreFormat } from '../types/Format'
import { validateVariables } from '../../../base/ValidateVariables'

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
  type?: MediaType

  /**
   * `status` is a string representing the status of the media.
   */
  status?: MediaListStatus

  /**
   * `notes` is a string representing any notes about the media.
   */
  notes?: string

  /**
   * `startedAt` is a number representing the start date of the media.
   */
  startedAt?: FuzzyDateInput

  /**
   * `completedAt` is a number representing the completion date of the media.
   */
  completedAt?: FuzzyDateInput

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
  status_in?: MediaListStatus[]

  /**
   * `status_not_in` is an array of strings representing the statuses not included in the media.
   */
  status_not_in?: MediaListStatus[]

  /**
   * `status_not` is a string representing the status not included in the media.
   */
  status_not?: MediaListStatus

  /**
   * `notes_like` is a string representing the notes similar to the media.
   */
  notes_like?: string

  /**
   * `startedAt_greater` is a number representing the start date greater than the media.
   */
  startedAt_greater?: FuzzyDateInput

  /**
   * `startedAt_lesser` is a number representing the start date lesser than the media.
   */
  startedAt_lesser?: FuzzyDateInput

  /**
   * `startedAt_like` is a string representing the start date similar to the media.
   */
  startedAt_like?: string

  /**
   * `completedAt_greater` is a number representing the completion date greater than the media.
   */
  completedAt_greater?: FuzzyDateInput

  /**
   * `completedAt_lesser` is a number representing the completion date lesser than the media.
   */
  completedAt_lesser?: FuzzyDateInput

  /**
   * `completedAt_like` is a string representing the completion date similar to the media.
   */
  completedAt_like?: string

  /**
   * `sort` is an array of strings representing the sort order of the media.
   */
  sort?: MediaListSort[]

  /**
   * `scoreFormat` is a string representing the format of the score of the media.
   */
  scoreFormat?: ScoreFormat

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
  async mediaListCollection (variables: MediaListCollectionVariables): Promise<MediaListCollectionResponse> {
    if (!variables) {
      throw new Error('At least one variable must be set')
    }
    const variableTypeMappings = {
      userId: 'number',
      userName: 'string',
      type: MediaTypeMappings,
      status: 'string',
      notes: 'string',
      startedAt: FuzzyDateMappings,
      completedAt: FuzzyDateMappings,
      forceSingleCompletedList: 'boolean',
      chunk: 'number',
      perChunk: 'number',
      status_in: MediaListStatusMappings,
      status_not_in: MediaListStatusMappings,
      status_not: MediaListStatusMappings,
      notes_like: 'string',
      startedAt_greater: FuzzyDateMappings,
      startedAt_lesser: FuzzyDateMappings,
      startedAt_like: 'string',
      completedAt_greater: FuzzyDateMappings,
      completedAt_lesser: FuzzyDateMappings,
      completedAt_like: 'string',
      sort: MediaListSortMappings
    }

    validateVariables(variables, variableTypeMappings)

    const query = MediaListCollectionQuerySchema

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
