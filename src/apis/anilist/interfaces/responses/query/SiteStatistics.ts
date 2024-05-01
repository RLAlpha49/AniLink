import { type SiteTrendConnection, SiteTrendConnectionSchema } from '../../SiteTrendConnection'

/**
 * `SiteStatisticsResponse` is an interface representing the response from a site statistics query.
 * It includes users, anime, manga, characters, staff, studios, and reviews of type `SiteTrendConnection`.
 */
export interface SiteStatisticsResponse {
  /**
   * `users` is an instance of `SiteTrendConnection` representing the users statistics.
   */
  users: SiteTrendConnection

  /**
   * `anime` is an instance of `SiteTrendConnection` representing the anime statistics.
   */
  anime: SiteTrendConnection

  /**
   * `manga` is an instance of `SiteTrendConnection` representing the manga statistics.
   */
  manga: SiteTrendConnection

  /**
   * `characters` is an instance of `SiteTrendConnection` representing the characters statistics.
   */
  characters: SiteTrendConnection

  /**
   * `staff` is an instance of `SiteTrendConnection` representing the staff statistics.
   */
  staff: SiteTrendConnection

  /**
   * `studios` is an instance of `SiteTrendConnection` representing the studios statistics.
   */
  studios: SiteTrendConnection

  /**
   * `reviews` is an instance of `SiteTrendConnection` representing the reviews statistics.
   */
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
