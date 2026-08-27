/**
 * {@link ScoreDistributionSchema} is a string representing the GraphQL schema for a score distribution.
 * It includes the score and the amount.
 * @see https://docs.anilist.co/reference/object/scoredistribution
 */
export const ScoreDistributionSchema = `
  scoreDistribution {
    score
    amount
  }
`;

/**
 * {@link StatusDistributionSchema} is a string representing the GraphQL schema for a status distribution.
 * It includes the status and amount.
 * @see https://docs.anilist.co/reference/object/statusdistribution
 */
export const StatusDistributionSchema = `
  statusDistribution {
    status
    amount
  }
`;
