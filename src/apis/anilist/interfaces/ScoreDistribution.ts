export interface ScoreDistribution {
  score: number
  amount: number
}

export const ScoreDistributionSchema = `
  scoreDistribution {
    score
    amount
  }
`
