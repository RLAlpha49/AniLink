/**
 * `Title` is an interface representing a title.
 * It includes the romaji, english, native, and userPreferred each having their own properties.
 */
export interface Title {
  /**
   * `romaji` is a string representing the romaji of the title.
   */
  romaji: string

  /**
   * `english` is a string representing the english of the title.
   */
  english: string

  /**
   * `native` is a string representing the native of the title.
   */
  native: string

  /**
   * `userPreferred` is a string representing the user preferred of the title.
   */
  userPreferred: string
}

/**
 * `TitleSchema` is a string representing the GraphQL schema for a title.
 * It includes the romaji, english, native, and userPreferred.
 */
export const TitleSchema = `
  title {
    romaji
    english
    native
    userPreferred
  }
`
