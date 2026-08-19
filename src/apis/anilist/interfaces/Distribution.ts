/**
 * `Distribution` is an interface representing a distribution.
 * It includes the status and amount each having their own properties.
 * @see https://docs.anilist.co/reference/object/statusdistribution
 */
export interface Distribution {
    /**
     * `status` is a string representing the status of the distribution.
     */
    status: string;

    /**
     * `amount` is a number representing the amount of the distribution.
     */
    amount: number;
}

/**
 * `ScoreDistribution` is an interface representing the score distribution of a media.
 * It includes the score and the amount each having their own properties.
 * @see https://docs.anilist.co/reference/object/scoredistribution
 */
export interface ScoreDistribution {
    /**
     * `score` is a number representing the score of the media.
     */
    score: number;

    /**
     * `amount` is a number representing the amount of the score.
     */
    amount: number;
}

/**
 * `ScoreDistributionSchema` is a string representing the GraphQL schema for a score distribution.
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
 * `StatusDistribution` is an interface representing the distribution of statuses.
 * It includes the status and amount each having their own properties.
 * @see https://docs.anilist.co/reference/object/statusdistribution
 */
export interface StatusDistribution {
    /**
     * `status` is a string representing the status.
     */
    status: string;

    /**
     * `amount` is a number representing the amount of the status.
     */
    amount: number;
}

/**
 * `StatusDistributionSchema` is a string representing the GraphQL schema for a status distribution.
 * It includes the status and amount.
 * @see https://docs.anilist.co/reference/object/statusdistribution
 */
export const StatusDistributionSchema = `
  statusDistribution {
    status
    amount
  }
`;
