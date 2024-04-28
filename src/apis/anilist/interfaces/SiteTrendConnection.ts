import { SiteTrend, SiteTrendSchema } from './SiteTrend'

export interface SiteTrendConnection {
  pageInfo: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    hasNextPage: boolean
  }
  edges: Array<{
    node: SiteTrend
  }>
  nodes: SiteTrend[]
}

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
