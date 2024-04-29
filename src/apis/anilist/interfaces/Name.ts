/**
 * `Name` is an interface representing a name.
 * It includes the first name, last name, full name, native name, alternative name, and user preferred name each having their own properties.
 */
export interface Name {
  /**
   * `first` is a string representing the first name.
   */
  first: string

  /**
   * `last` is a string representing the last name.
   */
  last: string

  /**
   * `full` is a string representing the full name.
   */
  full: string

  /**
   * `native` is a string representing the native name.
   */
  native: string

  /**
   * `alternative` is a string representing the alternative name.
   */
  alternative: string

  /**
   * `userPreferred` is a string representing the user preferred name.
   */
  userPreferred: string
}

/**
 * `NameSchema` is a string representing the GraphQL schema for a name.
 * It includes the first name, last name, full name, and native name.
 */
export const NameSchema = `
  name {
    first
    last
    full
    native
  }
`
