import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type AiringScheduleResponse, AiringScheduleSchema } from '../interfaces/responses/query/AiringSchedule'
import {AiringSort, AiringSortMappings} from "../types/Sort";
import {validateVariables} from "../../../base/ValidateVariables";

/**
 * `AiringScheduleVariables` is an interface representing the variables for the `AiringScheduleQuery`.
 * It includes optional id, mediaId, episode, airingAt, notYetAired, id_not, id_in, id_not_in, mediaId_not, mediaId_in, mediaId_not_in, episode_not, episode_in, episode_not_in, episode_greater, episode_lesser, airingAt_greater, airingAt_lesser, sort, and asHtml.
 */
export interface AiringScheduleVariables {
  /**
   * `id` is a number representing the id of the airing schedule.
   */
  id: number

  /**
   * `mediaId` is a number representing the id of the media.
   */
  mediaId: number

  /**
   * `episode` is a number representing the episode number.
   */
  episode?: number

  /**
   * `airingAt` is a number representing the airing time.
   */
  airingAt?: number

  /**
   * `notYetAired` is a boolean representing whether the episode has not yet aired.
   */
  notYetAired?: boolean

  /**
   * `id_not` is a number representing the id of the airing schedule that should not be included.
   */
  id_not?: number

  /**
   * `id_in` is an array of numbers representing the ids of the airing schedules that should be included.
   */
  id_in?: number[]

  /**
   * `id_not_in` is an array of numbers representing the ids of the airing schedules that should not be included.
   */
  id_not_in?: number[]

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
   * `episode_not` is a number representing the episode number that should not be included.
   */
  episode_not?: number

  /**
   * `episode_in` is an array of numbers representing the episode numbers that should be included.
   */
  episode_in?: number[]

  /**
   * `episode_not_in` is an array of numbers representing the episode numbers that should not be included.
   */
  episode_not_in?: number[]

  /**
   * `episode_greater` is a number representing the minimum episode number.
   */
  episode_greater?: number

  /**
   * `episode_lesser` is a number representing the maximum episode number.
   */
  episode_lesser?: number

  /**
   * `airingAt_greater` is a number representing the minimum airing time.
   */
  airingAt_greater?: number

  /**
   * `airingAt_lesser` is a number representing the maximum airing time.
   */
  airingAt_lesser?: number

  /**
   * `sort` is an array of strings representing the sort order.
   */
  sort?: AiringSort[]

  /**
   * `asHtml` is a boolean representing whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `AiringScheduleQuery` is a class representing a query for airing schedules.
 * It includes a method to get airing schedules.
 */
export class AiringScheduleQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `AiringScheduleQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `airingSchedule` is a method that sends a query request to get airing schedules.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async airingSchedule (variables: AiringScheduleVariables): Promise<AiringScheduleResponse> {
    if (!variables.id || !variables.mediaId) {
      throw new Error('The id or mediaId variables are required')
    }
    const variableTypeMappings = {
      id: 'number',
      mediaId: 'number',
      episode: 'number',
      airingAt: 'number',
      notYetAired: 'boolean',
      id_not: 'number',
      id_in: 'number[]',
      id_not_in: 'number[]',
      mediaId_not: 'number',
      mediaId_in: 'number[]',
      mediaId_not_in: 'number[]',
      episode_not: 'number',
      episode_in: 'number[]',
      episode_not_in: 'number[]',
      episode_greater: 'number',
      episode_lesser: 'number',
      airingAt_greater: 'number',
      airingAt_lesser: 'number',
      sort: AiringSortMappings,
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($id: Int, $mediaId: Int, $episode: Int, $airingAt: Int, $notYetAired: Boolean, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $mediaId_not: Int, $mediaId_in: [Int], $mediaId_not_in: [Int], $episode_not: Int, $episode_in: [Int], $episode_not_in: [Int], $episode_greater: Int, $episode_lesser: Int, $airingAt_greater: Int, $airingAt_lesser: Int, $sort: [AiringSort], $asHtml: Boolean) {
        AiringSchedule (id: $id, mediaId: $mediaId, episode: $episode, airingAt: $airingAt, notYetAired: $notYetAired, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, mediaId_not: $mediaId_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, episode_not: $episode_not, episode_in: $episode_in, episode_not_in: $episode_not_in, episode_greater: $episode_greater, episode_lesser: $episode_lesser, airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: $sort) {
          ${AiringScheduleSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
