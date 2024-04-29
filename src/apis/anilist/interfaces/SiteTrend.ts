/**
 * `SiteTrend` is an interface representing the site trend.
 * It includes the date, count, and change each having their own properties.
 */
export interface SiteTrend {
  /**
   * `date` is a number representing the date of the trend.
   */
  date: number

  /**
   * `count` is a number representing the count of the trend.
   */
  count: number

  /**
   * `change` is a number representing the change of the trend.
   */
  change: number
}

/**
 * `SiteTrendSchema` is a string representing the GraphQL schema for a site trend.
 * It includes the date, count, and change.
 */
export const SiteTrendSchema = `
  date
  count
  change
`
