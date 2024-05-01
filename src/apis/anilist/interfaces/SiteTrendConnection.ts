import { type SiteTrend, SiteTrendSchema } from './SiteTrend'

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
