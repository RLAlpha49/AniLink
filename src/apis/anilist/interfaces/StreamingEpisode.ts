/**
 * `StreamingEpisode` is an interface representing a streaming episode.
 * It includes the title, thumbnail, url, and site each having their own properties.
 */
export interface StreamingEpisode {
  /**
   * `title` is a string representing the title of the streaming episode.
   */
  title: string

  /**
   * `thumbnail` is a string representing the thumbnail of the streaming episode.
   */
  thumbnail: string

  /**
   * `url` is a string representing the url of the streaming episode.
   */
  url: string

  /**
   * `site` is a string representing the site of the streaming episode.
   */
  site: string
}

/**
 * `StreamingEpisodeSchema` is a string representing the GraphQL schema for a streaming episode.
 * It includes the title, thumbnail, url, and site.
 */
export const StreamingEpisodeSchema = `
  streamingEpisodes {
    title
    thumbnail
    url
    site
  }
`
