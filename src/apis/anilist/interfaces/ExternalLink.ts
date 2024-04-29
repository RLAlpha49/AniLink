/**
 * `ExternalLink` is an interface representing an external link.
 * It includes the id, url, and site each having their own properties.
 */
export interface ExternalLink {
  /**
   * `id` is a number representing the unique identifier of the external link.
   */
  id: number

  /**
   * `url` is a string representing the URL of the external link.
   */
  url: string

  /**
   * `site` is a string representing the site of the external link.
   */
  site: string
}

/**
 * `ExternalLinkSchema` is a string representing the GraphQL schema for an external link.
 * It includes the id, url, and site.
 */
export const ExternalLinkSchema = `
  externalLinks {
    id
    url
    site
  }
`
