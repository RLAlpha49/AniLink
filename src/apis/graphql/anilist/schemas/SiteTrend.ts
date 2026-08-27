/**
 * {@link SiteTrendSchema} is a string representing the GraphQL schema for a site trend.
 * It includes the date, count, and change.
 * @see https://docs.anilist.co/reference/object/sitetrend
 */
export const SiteTrendSchema = `
  date
  count
  change
`;

/**
 * {@link SiteTrendConnectionSchema} is a string representing the GraphQL schema for a site trend connection.
 * It includes the page information and the edges and nodes of the site trends.
 * @see https://docs.anilist.co/reference/object/sitetrendconnection
 */
export const SiteTrendConnectionSchema = `
  pageInfo {
    total
    perPage
    currentPage
    lastPage
    hasNextPage
  }
  edges {
    node {
      ${SiteTrendSchema}
    }
  }
  nodes {
    ${SiteTrendSchema}
  }
`;
