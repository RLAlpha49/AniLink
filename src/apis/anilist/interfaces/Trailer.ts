/**
 * `Trailer` is an interface representing a trailer.
 * It includes the id, site, and thumbnail each having their own properties.
 */
export interface Trailer {
  /**
   * `id` is a string representing the id of the trailer.
   */
  id: string

  /**
   * `site` is a string representing the site of the trailer.
   */
  site: string

  /**
   * `thumbnail` is a string representing the thumbnail of the trailer.
   */
  thumbnail: string
}

/**
 * `TrailerSchema` is a string representing the GraphQL schema for a trailer.
 * It includes the id, site, and thumbnail.
 */
export const TrailerSchema = `
  trailer {
    id
    site
    thumbnail
  }
`
