/**
 * `Ranking` is an interface representing the ranking of a media.
 * It includes the id, rank, type, format, year, season, all-time status, and context each having their own properties.
 */
export interface Ranking {
  /**
   * `id` is a number representing the id of the ranking.
   */
  id: number

  /**
   * `rank` is a number representing the rank of the media.
   */
  rank: number

  /**
   * `type` is a string representing the type of the ranking.
   */
  type: string

  /**
   * `format` is a string representing the format of the ranking.
   */
  format: string

  /**
   * `year` is a number representing the year of the ranking.
   */
  year: number

  /**
   * `season` is a string representing the season of the ranking.
   */
  season: string

  /**
   * `allTime` is a boolean representing whether the ranking is all-time or not.
   */
  allTime: boolean

  /**
   * `context` is a string representing the context of the ranking.
   */
  context: string
}

/**
 * `RankingSchema` is a string representing the GraphQL schema for a ranking.
 * It includes the id, rank, type, format, year, season, all-time status, and context.
 */
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
