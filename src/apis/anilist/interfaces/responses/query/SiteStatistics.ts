import { SiteTrendConnection, SiteTrendConnectionSchema } from '../../SiteTrendConnection'

/**
 * `SiteStatisticsResponse` is an interface representing the response from a site statistics query.
 * It includes users, anime, manga, characters, staff, studios, and reviews of type `SiteTrendConnection`.
 */
export interface SiteStatisticsResponse {
  users: SiteTrendConnection
  anime: SiteTrendConnection
  manga: SiteTrendConnection
  characters: SiteTrendConnection
  staff: SiteTrendConnection
  studios: SiteTrendConnection
  reviews: SiteTrendConnection
}

/**
 * `SiteStatisticsSchema` is a constant representing the GraphQL schema for a site statistics query.
 * It includes users, anime, manga, characters, staff, studios, and reviews of type `SiteTrendConnection`.
 */
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
