/**
 * `BasicThread` is an interface representing a basic thread.
 * It includes the id, title, body, and site url each having their own properties.
 */
export interface BasicThread {
  /**
   * `id` is a number representing the unique identifier of the thread.
   */
  id: number

  /**
   * `title` is a string representing the title of the thread.
   */
  title: string

  /**
   * `body` is a string representing the body content of the thread.
   */
  body: string

  /**
   * `siteUrl` is a string representing the URL of the site where the thread is posted.
   */
  siteUrl: string
}

/**
 * `BasicThreadSchema` is a string representing the GraphQL schema for a basic thread.
 * It includes the id, title, body, and site url.
 */
export const BasicThreadSchema = `
  id
  title
  body (asHtml: $asHtml)
  siteUrl
`
