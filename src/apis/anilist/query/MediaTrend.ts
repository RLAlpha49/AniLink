import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type MediaTrendResponse, MediaTrendSchema } from '../interfaces/responses/query/MediaTrend'
import { type MediaTrendSort, MediaTrendSortMappings } from '../types/Sort'
import { validateVariables } from '../../../base/ValidateVariables'

/**
 * `MediaTrendVariables` is an interface representing the variables for the `MediaTrendQuery`.
 * It includes optional parameters for querying media trend data.
 */
export interface MediaTrendVariables {
  /**
   * `mediaId` is a number representing the id of the media.
   */
  mediaId?: number

  /**
   * `date` is a number representing the date of the media trend.
   */
  date?: number

  /**
   * `trending` is a number representing the trending status of the media.
   */
  trending?: number

  /**
   * `averageScore` is a number representing the average score of the media.
   */
  averageScore?: number

  /**
   * `popularity` is a number representing the popularity of the media.
   */
  popularity?: number

  /**
   * `episode` is a number representing the episode of the media.
   */
  episode?: number

  /**
   * `releasing` is a boolean indicating whether the media is releasing.
   */
  releasing?: boolean

  /**
   * `mediaId_not` is a number representing the id of the media not included.
   */
  mediaId_not?: number

  /**
   * `mediaId_in` is an array of numbers representing the ids of the media included.
   */
  mediaId_in?: number[]

  /**
   * `mediaId_not_in` is an array of numbers representing the ids of the media not included.
   */
  mediaId_not_in?: number[]

  /**
   * `date_greater` is a number representing the date greater than the media trend.
   */
  date_greater?: number

  /**
   * `date_lesser` is a number representing the date lesser than the media trend.
   */
  date_lesser?: number

  /**
   * `trending_greater` is a number representing the trending status greater than the media.
   */
  trending_greater?: number

  /**
   * `trending_lesser` is a number representing the trending status lesser than the media.
   */
  trending_lesser?: number

  /**
   * `trending_not` is a number representing the trending status not included in the media.
   */
  trending_not?: number

  /**
   * `averageScore_greater` is a number representing the average score greater than the media.
   */
  averageScore_greater?: number

  /**
   * `averageScore_lesser` is a number representing the average score lesser than the media.
   */
  averageScore_lesser?: number

  /**
   * `averageScore_not` is a number representing the average score not included in the media.
   */
  averageScore_not?: number

  /**
   * `popularity_greater` is a number representing the popularity greater than the media.
   */
  popularity_greater?: number

  /**
   * `popularity_lesser` is a number representing the popularity lesser than the media.
   */
  popularity_lesser?: number

  /**
   * `popularity_not` is a number representing the popularity not included in the media.
   */
  popularity_not?: number

  /**
   * `episode_greater` is a number representing the episode number greater than the media.
   */
  episode_greater?: number

  /**
   * `episode_lesser` is a number representing the episode number lesser than the media.
   */
  episode_lesser?: number

  /**
   * `episode_not` is a number representing the episode number not included in the media.
   */
  episode_not?: number

  /**
   * `sort` is an array of strings representing the sort order of the media.
   */
  sort?: MediaTrendSort[]

  /**
   * `asHtml` is a boolean indicating whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `MediaTrendQuery` is a class representing a query for media trend data.
 * It includes a method to send the media trend query and receive the response.
 */
export class MediaTrendQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `MediaTrendQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `mediaTrend` is a method that sends a query request to get media trend data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async mediaTrend (variables: MediaTrendVariables): Promise<MediaTrendResponse> {
    if (!variables) {
      throw new Error('At least one variable must be set')
    }
    const variableTypeMappings = {
      mediaId: 'number',
      date: 'number',
      trending: 'number',
      averageScore: 'number',
      popularity: 'number',
      episode: 'number',
      releasing: 'boolean',
      mediaId_not: 'number',
      mediaId_in: 'number[]',
      mediaId_not_in: 'number[]',
      date_greater: 'number',
      date_lesser: 'number',
      trending_greater: 'number',
      trending_lesser: 'number',
      trending_not: 'number',
      averageScore_greater: 'number',
      averageScore_lesser: 'number',
      averageScore_not: 'number',
      popularity_greater: 'number',
      popularity_lesser: 'number',
      popularity_not: 'number',
      episode_greater: 'number',
      episode_lesser: 'number',
      episode_not: 'number',
      sort: MediaTrendSortMappings,
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($mediaId: Int, $date: Int, $trending: Int, $averageScore: Int, $popularity: Int, $episode: Int, $releasing: Boolean, $mediaId_not: Int, $mediaId_in: [Int], $mediaId_not_in: [Int], $date_greater: Int, $date_lesser: Int, $trending_greater: Int, $trending_lesser: Int, $trending_not: Int, $averageScore_greater: Int, $averageScore_lesser: Int, $averageScore_not: Int, $popularity_greater: Int, $popularity_lesser: Int, $popularity_not: Int, $episode_greater: Int, $episode_lesser: Int, $episode_not: Int, $sort: [MediaTrendSort], $asHtml: Boolean) {
        MediaTrend (mediaId: $mediaId, date: $date, trending: $trending, averageScore: $averageScore, popularity: $popularity, episode: $episode, releasing: $releasing, mediaId_not: $mediaId_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, date_greater: $date_greater, date_lesser: $date_lesser, trending_greater: $trending_greater, trending_lesser: $trending_lesser, trending_not: $trending_not, averageScore_greater: $averageScore_greater, averageScore_lesser: $averageScore_lesser, averageScore_not: $averageScore_not, popularity_greater: $popularity_greater, popularity_lesser: $popularity_lesser, popularity_not: $popularity_not, episode_greater: $episode_greater, episode_lesser: $episode_lesser, episode_not: $episode_not, sort: $sort) {
          ${MediaTrendSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
