/**
 * `SiteTrend` is an interface representing the site trend.
 * It includes the date, count, and change each having their own properties.
 */
export interface SiteTrend {
  /**
   * `date` is a number representing the date of the trend.
   */
  date: number

  /**
   * `count` is a number representing the count of the trend.
   */
  count: number

  /**
   * `change` is a number representing the change of the trend.
   */
  change: number
}

/**
 * `SiteTrendSchema` is a string representing the GraphQL schema for a site trend.
 * It includes the date, count, and change.
 */
export const SiteTrendSchema = `
  date
  count
  change
`

/**
 * `SiteTrendConnection` is an interface representing the connection of site trends.
 * It includes the page information and the edges and nodes of the site trends each having their own properties.
 */
export interface SiteTrendConnection {
  /**
   * `pageInfo` is an object representing the page information of the site trends.
   * It includes the total number of pages, the number of items per page, the current page number, the last page number, and whether there is a next page.
   */
  pageInfo: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    hasNextPage: boolean
  }

  /**
   * `edges` is an array representing the edges of the site trends.
   * Each edge includes a node which is a `SiteTrend`.
   */
  edges: Array<{
    node: SiteTrend
  }>

  /**
   * `nodes` is an array representing the nodes of the site trends.
   * Each node is a `SiteTrend`.
   */
  nodes: SiteTrend[]
}

/**
 * `SiteTrendConnectionSchema` is a string representing the GraphQL schema for a site trend connection.
 * It includes the page information and the edges and nodes of the site trends.
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
`
