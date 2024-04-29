import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { SiteStatisticsResponse, SiteStatisticsSchema } from '../interfaces/responses/query/SiteStatistics'

interface SiteStatisticsVariables {
  usersSort?: string
  usersPage?: number
  usersPerPage?: number
  animeSort?: string
  animePage?: number
  animePerPage?: number
  mangaSort?: string
  mangaPage?: number
  mangaPerPage?: number
  charactersSort?: string
  charactersPage?: number
  charactersPerPage?: number
  staffSort?: string
  staffPage?: number
  staffPerPage?: number
  studiosSort?: string
  studiosPage?: number
  studiosPerPage?: number
  reviewsSort?: string
  reviewsPage?: number
  reviewsPerPage?: number
}

export class SiteStatisticsQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async siteStatistics (variables?: SiteStatisticsVariables): Promise<SiteStatisticsResponse> {
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
