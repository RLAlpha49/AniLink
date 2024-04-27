export interface Ranking {
  id: number
  rank: number
  type: string
  format: string
  year: number
  season: string
  allTime: boolean
  context: string
}

export const RankingSchema = `
  rankings {
    id
    rank
    type
    format
    year
    season
    allTime
    context
  }
`
