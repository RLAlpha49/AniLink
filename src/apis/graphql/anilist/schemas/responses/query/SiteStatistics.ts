import { SiteTrendConnectionSchema } from "../../SiteTrend";

/**
 * {@link SiteStatisticsSchema} is a constant representing the GraphQL schema for a site statistics query.
 * It includes users, anime, manga, characters, staff, studios, and reviews of type `SiteTrendConnection`.
 * @see https://docs.anilist.co/reference/object/sitestatistics
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
`;
