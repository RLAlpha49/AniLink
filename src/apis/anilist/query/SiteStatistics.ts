import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type SiteStatisticsResponse, SiteStatisticsSchema } from '../interfaces/responses/query/SiteStatistics'
import {SiteTrendSort, SiteTrendSortMappings} from "../types/Sort";
import {validateVariables} from "../../../base/ValidateVariables";

/**
 * `SiteStatisticsVariables` is an interface representing the variables for the `SiteStatisticsQuery`.
 * It includes optional parameters for querying site statistics data.
 */
export interface SiteStatisticsVariables {
  /**
   * `usersSort` is a string representing the sort order of the users.
   */
  usersSort?: SiteTrendSort[]

  /**
   * `usersPage` is a number representing the page number of the users.
   */
  usersPage?: number

  /**
   * `usersPerPage` is a number representing the number of users per page.
   */
  usersPerPage?: number

  /**
   * `animeSort` is a string representing the sort order of the anime.
   */
  animeSort?: SiteTrendSort[]

  /**
   * `animePage` is a number representing the page number of the anime.
   */
  animePage?: number

  /**
   * `animePerPage` is a number representing the number of anime per page.
   */
  animePerPage?: number

  /**
   * `mangaSort` is a string representing the sort order of the manga.
   */
  mangaSort?: SiteTrendSort[]

  /**
   * `mangaPage` is a number representing the page number of the manga.
   */
  mangaPage?: number

  /**
   * `mangaPerPage` is a number representing the number of manga per page.
   */
  mangaPerPage?: number

  /**
   * `charactersSort` is a string representing the sort order of the characters.
   */
  charactersSort?: SiteTrendSort[]

  /**
   * `charactersPage` is a number representing the page number of the characters.
   */
  charactersPage?: number

  /**
   * `charactersPerPage` is a number representing the number of characters per page.
   */
  charactersPerPage?: number

  /**
   * `staffSort` is a string representing the sort order of the staff.
   */
  staffSort?: SiteTrendSort[]

  /**
   * `staffPage` is a number representing the page number of the staff.
   */
  staffPage?: number

  /**
   * `staffPerPage` is a number representing the number of staff per page.
   */
  staffPerPage?: number

  /**
   * `studiosSort` is a string representing the sort order of the studios.
   */
  studiosSort?: SiteTrendSort[]

  /**
   * `studiosPage` is a number representing the page number of the studios.
   */
  studiosPage?: number

  /**
   * `studiosPerPage` is a number representing the number of studios per page.
   */
  studiosPerPage?: number

  /**
   * `reviewsSort` is a string representing the sort order of the reviews.
   */
  reviewsSort?: SiteTrendSort[]

  /**
   * `reviewsPage` is a number representing the page number of the reviews.
   */
  reviewsPage?: number

  /**
   * `reviewsPerPage` is a number representing the number of reviews per page.
   */
  reviewsPerPage?: number
}

/**
 * `SiteStatisticsQuery` is a class representing a query for site statistics data.
 * It includes a method to send the site statistics query and receive the response.
 */
export class SiteStatisticsQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `SiteStatisticsQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `siteStatistics` is a method that sends a query request to get site statistics data.
   *
   * @param variables - The variables for the query. If not provided, an empty object will be used.
   * @returns The response from the query request.
   */
  async siteStatistics (variables: SiteStatisticsVariables = {}): Promise<SiteStatisticsResponse> {
    const variableTypeMappings = {
      usersSort: SiteTrendSortMappings,
      usersPage: 'number',
      usersPerPage: 'number',
      animeSort: SiteTrendSortMappings,
      animePage: 'number',
      animePerPage: 'number',
      mangaSort: SiteTrendSortMappings,
      mangaPage: 'number',
      mangaPerPage: 'number',
      charactersSort: SiteTrendSortMappings,
      charactersPage: 'number',
      charactersPerPage: 'number',
      staffSort: SiteTrendSortMappings,
      staffPage: 'number',
      staffPerPage: 'number',
      studiosSort: SiteTrendSortMappings,
      studiosPage: 'number',
      studiosPerPage: 'number',
      reviewsSort: SiteTrendSortMappings,
      reviewsPage: 'number',
      reviewsPerPage: 'number'
    }

    if (Object(variables).length > 0) {
      validateVariables(variables, variableTypeMappings)
    }

    const query = `
      query ($usersSort: [SiteTrendSort], $usersPage: Int, $usersPerPage: Int, $animeSort: [SiteTrendSort], $animePage: Int, $animePerPage: Int, $mangaSort: [SiteTrendSort], $mangaPage: Int, $mangaPerPage: Int, $charactersSort: [SiteTrendSort], $charactersPage: Int, $charactersPerPage: Int, $staffSort: [SiteTrendSort], $staffPage: Int, $staffPerPage: Int, $studiosSort: [SiteTrendSort], $studiosPage: Int, $studiosPerPage: Int, $reviewsSort: [SiteTrendSort], $reviewsPage: Int, $reviewsPerPage: Int) {
        SiteStatistics {
          ${SiteStatisticsSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
