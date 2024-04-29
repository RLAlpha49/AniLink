/**
 * `Image` is an interface representing an image.
 * It includes the large and medium size images each having their own properties.
 */
export interface Image {
  /**
   * `large` is a string representing the URL of the large size image.
   */
  large: string

  /**
   * `medium` is a string representing the URL of the medium size image.
   */
  medium: string
}

/**
 * `ImageSchema` is a string representing the GraphQL schema for an image.
 * It includes the large and medium size images.
 */
export const ImageSchema = `
  image {
    large
    medium
  }
`
