/**
 * `ScoreDistribution` is an interface representing the score distribution of a media.
 * It includes the score and the amount each having their own properties.
 */
export interface ScoreDistribution {
  /**
   * `score` is a number representing the score of the media.
   */
  score: number

  /**
   * `amount` is a number representing the amount of the score.
   */
  amount: number
}

/**
 * `ScoreDistributionSchema` is a string representing the GraphQL schema for a score distribution.
 * It includes the score and the amount.
 */
export const ScoreDistributionSchema = `
  scoreDistribution {
    score
    amount
  }
`
