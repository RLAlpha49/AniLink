import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { type MediaTrendResponse, MediaTrendSchema } from '../../interfaces/responses/query/MediaTrend'
import {MediaTrendSortMappings} from "../../types/Sort";
import {validateVariables} from "../../../../base/ValidateVariables";

/**
 * `MediaTrendsVariables` is an interface representing the variables for the `MediaTrendsQuery`.
 * It includes optional page, per page, media id, date, trending, average score, popularity, episode, releasing, media id not, media id in, media id not in, date greater, date lesser, trending greater, trending lesser, trending not, average score greater, average score lesser, average score not, popularity greater, popularity lesser, popularity not, episode greater, episode lesser, episode not, sort, and as html.
 */
export interface MediaTrendsVariables {
  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number

  /**
   * `mediaId` is a number representing the id of the media.
   */
  mediaId?: number

  /**
   * `date` is a number representing the date.
   */
  date?: number

  /**
   * `trending` is a number representing the trending score.
   */
  trending?: number

  /**
   * `averageScore` is a number representing the average score.
   */
  averageScore?: number

  /**
   * `popularity` is a number representing the popularity score.
   */
  popularity?: number

  /**
   * `episode` is a number representing the episode number.
   */
  episode?: number

  /**
   * `releasing` is a boolean representing whether the media is releasing.
   */
  releasing?: boolean

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
   * `date_greater` is a number representing the minimum date.
   */
  date_greater?: number

  /**
   * `date_lesser` is a number representing the maximum date.
   */
  date_lesser?: number

  /**
   * `trending_greater` is a number representing the minimum trending score.
   */
  trending_greater?: number

  /**
   * `trending_lesser` is a number representing the maximum trending score.
   */
  trending_lesser?: number

  /**
   * `trending_not` is a number representing the trending score that should not be included.
   */
  trending_not?: number

  /**
   * `averageScore_greater` is a number representing the minimum average score.
   */
  averageScore_greater?: number

  /**
   * `averageScore_lesser` is a number representing the maximum average score.
   */
  averageScore_lesser?: number

  /**
   * `averageScore_not` is a number representing the average score that should not be included.
   */
  averageScore_not?: number

  /**
   * `popularity_greater` is a number representing the minimum popularity score.
   */
  popularity_greater?: number

  /**
   * `popularity_lesser` is a number representing the maximum popularity score.
   */
  popularity_lesser?: number

  /**
   * `popularity_not` is a number representing the popularity score that should not be included.
   */
  popularity_not?: number

  /**
   * `episode_greater` is a number representing the minimum episode number.
   */
  episode_greater?: number

  /**
   * `episode_lesser` is a number representing the maximum episode number.
   */
  episode_lesser?: number

  /**
   * `episode_not` is a number representing the episode number that should not be included.
   */
  episode_not?: number

  /**
   * `sort` is an array of strings representing the sort order.
   */
  sort?: string[]

  /**
   * `asHtml` is a boolean representing whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `MediaTrendsQuery` is a class representing a query for media trends.
 * It includes a method to get media trends.
 */
export class MediaTrendsQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `MediaTrendsQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `mediaTrends` is a method that sends a query request to get media trends.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async mediaTrends (variables: MediaTrendsVariables): Promise<MediaTrendResponse> {
    if (!variables) {
      throw new Error('At least one variable must be set')
    }
    const variableTypeMappings = {
      page: 'number',
      perPage: 'number',
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
      query ($page: Int, $perPage: Int, $mediaId: Int, $date: Int, $trending: Int, $averageScore: Int, $popularity: Int, $episode: Int, $releasing: Boolean, $mediaId_not: Int, $mediaId_in: [Int], $mediaId_not_in: [Int], $date_greater: Int, $date_lesser: Int, $trending_greater: Int, $trending_lesser: Int, $trending_not: Int, $averageScore_greater: Int, $averageScore_lesser: Int, $averageScore_not: Int, $popularity_greater: Int, $popularity_lesser: Int, $popularity_not: Int, $episode_greater: Int, $episode_lesser: Int, $episode_not: Int, $sort: [MediaTrendSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          mediaTrends (mediaId: $mediaId, date: $date, trending: $trending, averageScore: $averageScore, popularity: $popularity, episode: $episode, releasing: $releasing, mediaId_not: $mediaId_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, date_greater: $date_greater, date_lesser: $date_lesser, trending_greater: $trending_greater, trending_lesser: $trending_lesser, trending_not: $trending_not, averageScore_greater: $averageScore_greater, averageScore_lesser: $averageScore_lesser, averageScore_not: $averageScore_not, popularity_greater: $popularity_greater, popularity_lesser: $popularity_lesser, popularity_not: $popularity_not, episode_greater: $episode_greater, episode_lesser: $episode_lesser, episode_not: $episode_not, sort: $sort) {
            ${MediaTrendSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
