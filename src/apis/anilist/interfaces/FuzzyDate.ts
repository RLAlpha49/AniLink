/**
 * `FuzzyDate` is an interface representing a fuzzy date.
 * It includes the year, month, and day each having their own properties.
 */
export interface FuzzyDate {
  /**
   * `year` is a number representing the year of the fuzzy date.
   */
  year: number

  /**
   * `month` is a number representing the month of the fuzzy date.
   */
  month: number

  /**
   * `day` is a number representing the day of the fuzzy date.
   */
  day: number
}

/**
 * `FuzzyDateSchema` is a string representing the GraphQL schema for a fuzzy date.
 * It includes the year, month, and day.
 */
export const FuzzyDateSchema = `
  year
  month
  day
`
