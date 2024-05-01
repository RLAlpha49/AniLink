import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type MediaResponse, MediaWithRelationsSchema } from '../interfaces/responses/query/Media'

/**
 * `MediaVariables` is an interface representing the variables for the `MediaQuery`.
 * It includes optional parameters for querying media data.
 */
export interface MediaVariables {
  /**
   * `id` is a number representing the id of the media.
   */
  id?: number

  /**
   * `idMal` is a number representing the MyAnimeList id of the media.
   */
  idMal?: number

  /**
   * `startDate` is a number representing the start date of the media.
   */
  startDate?: number

  /**
   * `endDate` is a number representing the end date of the media.
   */
  endDate?: number

  /**
   * `season` is a string representing the season of the media.
   */
  season?: string

  /**
   * `seasonYear` is a number representing the year of the season of the media.
   */
  seasonYear?: number

  /**
   * `type` is a string representing the type of the media. It can be either 'ANIME' or 'MANGA'.
   */
  type?: 'ANIME' | 'MANGA'

  /**
   * `format` is a string representing the format of the media.
   */
  format?: string

  /**
   * `status` is a string representing the status of the media.
   */
  status?: string

  /**
   * `episodes` is a number representing the number of episodes of the media.
   */
  episodes?: number

  /**
   * `duration` is a number representing the duration of the media.
   */
  duration?: number

  /**
   * `chapters` is a number representing the number of chapters of the media.
   */
  chapters?: number

  /**
   * `volumes` is a number representing the number of volumes of the media.
   */
  volumes?: number

  /**
   * `isAdult` is a boolean representing whether the media is for adults.
   */
  isAdult?: boolean

  /**
   * `genre` is a string representing the genre of the media.
   */
  genre?: string

  /**
   * `tag` is a string representing the tag of the media.
   */
  tag?: string

  /**
   * `minimumTagRank` is a number representing the minimum tag rank of the media.
   */
  minimumTagRank?: number

  /**
   * `tagCategory` is a string representing the category of the tag of the media.
   */
  tagCategory?: string

  /**
   * `onList` is a boolean representing whether the media is on the list.
   */
  onList?: boolean

  /**
   * `licensedBy` is a string representing who licensed the media.
   */
  licensedBy?: string

  /**
   * `licensedById` is a number representing the id of who licensed the media.
   */
  licensedById?: number

  /**
   * `averageScore` is a number representing the average score of the media.
   */
  averageScore?: number

  /**
   * `popularity` is a number representing the popularity of the media.
   */
  popularity?: number

  /**
   * `source` is a string representing the source of the media.
   */
  source?: string

  /**
   * `countryOfOrigin` is a string representing the country of origin of the media.
   */
  countryOfOrigin?: string

  /**
   * `isLicensed` is a boolean representing whether the media is licensed.
   */
  isLicensed?: boolean

  /**
   * `search` is a string representing the search query for the media.
   */
  search?: string

  /**
   * `id_not` is a number representing the id of the media that should not be included.
   */
  id_not?: number

  /**
   * `id_in` is an array of numbers representing the ids of the media that should be included.
   */
  id_in?: number[]

  /**
   * `id_not_in` is an array of numbers representing the ids of the media that should not be included.
   */
  id_not_in?: number[]

  /**
   * `idMal_not` is a number representing the MyAnimeList id of the media that should not be included.
   */
  idMal_not?: number

  /**
   * `idMal_in` is an array of numbers representing the MyAnimeList ids of the media that should be included.
   */
  idMal_in?: number[]

  /**
   * `idMal_not_in` is an array of numbers representing the MyAnimeList ids of the media that should not be included.
   */
  idMal_not_in?: number[]

  /**
   * `startDate_greater` is a number representing the start date of the media that should be greater.
   */
  startDate_greater?: number

  /**
   * `startDate_lesser` is a number representing the start date of the media that should be lesser.
   */
  startDate_lesser?: number

  /**
   * `startDate_like` is a string representing the start date of the media that should be like.
   */
  startDate_like?: string

  /**
   * `endDate_greater` is a number representing the end date of the media that should be greater.
   */
  endDate_greater?: number

  /**
   * `endDate_lesser` is a number representing the end date of the media that should be lesser.
   */
  endDate_lesser?: number

  /**
   * `endDate_like` is a string representing the end date of the media that should be like.
   */
  endDate_like?: string

  /**
   * `format_in` is an array of strings representing the formats of the media that should be included.
   */
  format_in?: string[]

  /**
   * `format_not` is a string representing the format of the media that should not be included.
   */
  format_not?: string

  /**
   * `format_not_in` is an array of strings representing the formats of the media that should not be included.
   */
  format_not_in?: string[]

  /**
   * `status_in` is an array of strings representing the statuses of the media that should be included.
   */
  status_in?: string[]

  /**
   * `status_not` is a string representing the status of the media that should not be included.
   */
  status_not?: string

  /**
   * `status_not_in` is an array of strings representing the statuses of the media that should not be included.
   */
  status_not_in?: string[]

  /**
   * `episodes_greater` is a number representing the number of episodes of the media that should be greater.
   */
  episodes_greater?: number

  /**
   * `episodes_lesser` is a number representing the number of episodes of the media that should be lesser.
   */
  episodes_lesser?: number

  /**
   * `duration_greater` is a number representing the duration of the media that should be greater.
   */
  duration_greater?: number

  /**
   * `duration_lesser` is a number representing the duration of the media that should be lesser.
   */
  duration_lesser?: number

  /**
   * `chapters_greater` is a number representing the number of chapters of the media that should be greater.
   */
  chapters_greater?: number

  /**
   * `chapters_lesser` is a number representing the number of chapters of the media that should be lesser.
   */
  chapters_lesser?: number

  /**
   * `volumes_greater` is a number representing the number of volumes of the media that should be greater.
   */
  volumes_greater?: number

  /**
   * `volumes_lesser` is a number representing the number of volumes of the media that should be lesser.
   */
  volumes_lesser?: number

  /**
   * `genre_in` is an array of strings representing the genres of the media that should be included.
   */
  genre_in?: string[]

  /**
   * `genre_not_in` is an array of strings representing the genres of the media that should not be included.
   */
  genre_not_in?: string[]

  /**
   * `tag_in` is an array of strings representing the tags of the media that should be included.
   */
  tag_in?: string[]

  /**
   * `tag_not_in` is an array of strings representing the tags of the media that should not be included.
   */
  tag_not_in?: string[]

  /**
   * `tagCategory_in` is an array of strings representing the categories of the tags of the media that should be included.
   */
  tagCategory_in?: string[]

  /**
   * `tagCategory_not_in` is an array of strings representing the categories of the tags of the media that should not be included.
   */
  tagCategory_not_in?: string[]

  /**
   * `licensedBy_in` is an array of strings representing who licensed the media that should be included.
   */
  licensedBy_in?: string[]

  /**
   * `licensedById_in` is an array of numbers representing the ids of who licensed the media that should be included.
   */
  licensedById_in?: number[]

  /**
   * `averageScore_not` is a number representing the average score of the media that should not be included.
   */
  averageScore_not?: number

  /**
   * `averageScore_greater` is a number representing the average score of the media that should be greater.
   */
  averageScore_greater?: number

  /**
   * `averageScore_lesser` is a number representing the average score of the media that should be lesser.
   */
  averageScore_lesser?: number

  /**
   * `popularity_not` is a number representing the popularity of the media that should not be included.
   */
  popularity_not?: number

  /**
   * `popularity_greater` is a number representing the popularity of the media that should be greater.
   */
  popularity_greater?: number

  /**
   * `popularity_lesser` is a number representing the popularity of the media that should be lesser.
   */
  popularity_lesser?: number

  /**
   * `source_in` is an array of strings representing the sources of the media that should be included.
   */
  source_in?: string[]

  /**
   * `sort` is an array of strings representing the sorting of the media.
   */
  sort?: string[]

  /**
   * `asHtml` is a boolean representing whether the media should be returned as HTML.
   */
  asHtml?: boolean
}

/**
 * `MediaQuery` is a class representing a query for media data.
 * It includes a method to send the media query and receive the response.
 */
export class MediaQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `MediaQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `media` is a method that sends a query request to get media data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async media (variables?: MediaVariables): Promise<MediaResponse> {
    const query = `
      query ($id: Int, $idMal: Int, $startDate: FuzzyDateInt, $endDate: FuzzyDateInt, $season: MediaSeason, $seasonYear: Int, $type: MediaType, $format: MediaFormat, $status: MediaStatus, $episodes: Int, $duration: Int, $chapters: Int, $volumes: Int, $isAdult: Boolean, $genre: String, $tag: String, $minimumTagRank: Int, $tagCategory: String, $onList: Boolean, $licensedBy: String, $licensedById: Int, $averageScore: Int, $popularity: Int, $source: MediaSource, $countryOfOrigin: CountryCode, $isLicensed: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $idMal_not: Int, $idMal_in: [Int], $idMal_not_in: [Int], $startDate_greater: FuzzyDateInt, $startDate_lesser: FuzzyDateInt, $startDate_like: String, $endDate_greater: FuzzyDateInt, $endDate_lesser: FuzzyDateInt, $endDate_like: String, $format_in: [MediaFormat], $format_not: MediaFormat, $format_not_in: [MediaFormat], $status_in: [MediaStatus], $status_not: MediaStatus, $status_not_in: [MediaStatus], $episodes_greater: Int, $episodes_lesser: Int, $duration_greater: Int, $duration_lesser: Int, $chapters_greater: Int, $chapters_lesser: Int, $volumes_greater: Int, $volumes_lesser: Int, $genre_in: [String], $genre_not_in: [String], $tag_in: [String], $tag_not_in: [String], $tagCategory_in: [String], $tagCategory_not_in: [String], $licensedBy_in: [String], $licensedById_in: [Int], $averageScore_not: Int, $averageScore_greater: Int, $averageScore_lesser: Int, $popularity_not: Int, $popularity_greater: Int, $popularity_lesser: Int, $source_in: [MediaSource], $sort: [MediaSort], $asHtml: Boolean) {
        Media (id: $id, idMal: $idMal, startDate: $startDate, endDate: $endDate, season: $season, seasonYear: $seasonYear, type: $type, format: $format, status: $status, episodes: $episodes, duration: $duration, chapters: $chapters, volumes: $volumes, isAdult: $isAdult, genre: $genre, tag: $tag, minimumTagRank: $minimumTagRank, tagCategory: $tagCategory, onList: $onList, licensedBy: $licensedBy, licensedById: $licensedById, averageScore: $averageScore, popularity: $popularity, source: $source, countryOfOrigin: $countryOfOrigin, isLicensed: $isLicensed, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, idMal_not: $idMal_not, idMal_in: $idMal_in, idMal_not_in: $idMal_not_in, startDate_greater: $startDate_greater, startDate_lesser: $startDate_lesser, startDate_like: $startDate_like, endDate_greater: $endDate_greater, endDate_lesser: $endDate_lesser, endDate_like: $endDate_like, format_in: $format_in, format_not: $format_not, format_not_in: $format_not_in, status_in: $status_in, status_not: $status_not, status_not_in: $status_not_in, episodes_greater: $episodes_greater, episodes_lesser: $episodes_lesser, duration_greater: $duration_greater, duration_lesser: $duration_lesser, chapters_greater: $chapters_greater, chapters_lesser: $chapters_lesser, volumes_greater: $volumes_greater, volumes_lesser: $volumes_lesser, genre_in: $genre_in, genre_not_in: $genre_not_in, tag_in: $tag_in, tag_not_in: $tag_not_in, tagCategory_in: $tagCategory_in, tagCategory_not_in: $tagCategory_not_in, licensedBy_in: $licensedBy_in, licensedById_in: $licensedById_in, averageScore_not: $averageScore_not, averageScore_greater: $averageScore_greater, averageScore_lesser: $averageScore_lesser, popularity_not: $popularity_not, popularity_greater: $popularity_greater, popularity_lesser: $popularity_lesser, source_in: $source_in, sort: $sort) {
          ${MediaWithRelationsSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
