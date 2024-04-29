/**
 * `StatusDistribution` is an interface representing the distribution of statuses.
 * It includes the status and amount each having their own properties.
 */
export interface StatusDistribution {
  /**
   * `status` is a string representing the status.
   */
  status: string

  /**
   * `amount` is a number representing the amount of the status.
   */
  amount: number
}

/**
 * `StatusDistributionSchema` is a string representing the GraphQL schema for a status distribution.
 * It includes the status and amount.
 */
export const StatusDistributionSchema = `
  statusDistribution {
    status
    amount
  }
`
