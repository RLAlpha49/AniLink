/**
 * `CoverImage` is an interface representing a cover image.
 * It includes the extra large, large, medium size images and color each having their own properties.
 */
export interface CoverImage {
  /**
   * `extraLarge` is a string representing the URL of the extra large size cover image.
   */
  extraLarge: string

  /**
   * `large` is a string representing the URL of the large size cover image.
   */
  large: string

  /**
   * `medium` is a string representing the URL of the medium size cover image.
   */
  medium: string

  /**
   * `color` is a string representing the color of the cover image.
   */
  color: string
}

/**
 * `CoverImageSchema` is a string representing the GraphQL schema for a cover image.
 * It includes the extra large, large, medium size images and color.
 */
export const CoverImageSchema = `
  coverImage {
    extraLarge
    large
    medium
    color
  }
`
