/**
 * {@link SiteTrendSchema} is the site-trend selection: one day of a site-statistics
 * category, with its total count and the change since the previous day.
 * @see https://docs.anilist.co/reference/object/sitetrend
 */
export const SiteTrendSchema = `
  date
  count
  change
`;

/**
 * {@link SiteTrendConnectionSchema} is the paginated site-trend connection: `pageInfo`
 * plus the trend rows in both `edges` and `nodes` form. The site-statistics fragment
 * interpolates it once per category.
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
