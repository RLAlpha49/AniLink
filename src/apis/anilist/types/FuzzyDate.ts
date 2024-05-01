/**
 * `FuzzyDateInput` is a type representing a fuzzy date input.
 * It includes the year, month, and day each having their own optional properties.
 */
export type FuzzyDateInput = {
  /**
   * `year` is an optional number representing the year of the fuzzy date input.
   */
  year: number

  /**
   * `month` is an optional number representing the month of the fuzzy date input.
   */
  month: number

  /**
   * `day` is an optional number representing the day of the fuzzy date input.
   */
  day: number
}

/**
 * `FuzzyDateMappings` is a constant that maps the `FuzzyDateInput` fields to their expected types.
 * The `year`, `month`, and `day` fields are mapped to 'number'.
 */
export const FuzzyDateMappings = {
  year: 'number',
  month: 'number',
  day: 'number'
}
