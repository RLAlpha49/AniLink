/**
 * {@link ScoreDistributionSchema} is the score-distribution selection: how many entries
 * were given each score value.
 * @see https://docs.anilist.co/reference/object/scoredistribution
 */
export const ScoreDistributionSchema = `
  scoreDistribution {
    score
    amount
  }
`;

/**
 * {@link StatusDistributionSchema} is the status-distribution selection: how many
 * entries hold each list status.
 * @see https://docs.anilist.co/reference/object/statusdistribution
 */
export const StatusDistributionSchema = `
  statusDistribution {
    status
    amount
  }
`;
