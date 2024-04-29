import { SiteTrendConnection, SiteTrendConnectionSchema } from '../../SiteTrendConnection'

export interface SiteStatisticsResponse {
  users: SiteTrendConnection
  anime: SiteTrendConnection
  manga: SiteTrendConnection
  characters: SiteTrendConnection
  staff: SiteTrendConnection
  studios: SiteTrendConnection
  reviews: SiteTrendConnection
}

export const SiteStatisticsSchema = `
  users (sort: $usersSort, page: $usersPage, perPage: $usersPerPage) {
    ${SiteTrendConnectionSchema}
  }
  anime (sort: $animeSort, page: $animePage, perPage: $animePerPage) {
    ${SiteTrendConnectionSchema}
  }
  manga (sort: $mangaSort, page: $mangaPage, perPage: $mangaPerPage) {
    ${SiteTrendConnectionSchema}
  }
  characters (sort: $charactersSort, page: $charactersPage, perPage: $charactersPerPage) {
    ${SiteTrendConnectionSchema}
  }
  staff (sort: $staffSort, page: $staffPage, perPage: $staffPerPage) {
    ${SiteTrendConnectionSchema}
  }
  studios (sort: $studiosSort, page: $studiosPage, perPage: $studiosPerPage) {
    ${SiteTrendConnectionSchema}
  }
  reviews (sort: $reviewsSort, page: $reviewsPage, perPage: $reviewsPerPage) {
    ${SiteTrendConnectionSchema}
  }
`
