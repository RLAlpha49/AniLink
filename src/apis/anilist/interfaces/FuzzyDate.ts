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
 * `FuzzyDateInput` is an interface representing a fuzzy date input.
 * It includes the year, month, and day each having their own optional properties.
 */
export interface FuzzyDateInput {
  /**
   * `year` is an optional number representing the year of the fuzzy date input.
   */
  year?: number

  /**
   * `month` is an optional number representing the month of the fuzzy date input.
   */
  month?: number

  /**
   * `day` is an optional number representing the day of the fuzzy date input.
   */
  day?: number
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
