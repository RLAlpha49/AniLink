/**
 * `NextAiringEpisode` is an interface representing the next airing episode of a media.
 * It includes the airing time, time until airing, and the episode number each having their own properties.
 */
export interface NextAiringEpisode {
  /**
   * `airingAt` is a number representing the airing time of the next episode.
   */
  airingAt: number

  /**
   * `timeUntilAiring` is a number representing the time until the next episode airs.
   */
  timeUntilAiring: number

  /**
   * `episode` is a number representing the episode number of the next airing episode.
   */
  episode: number
}

/**
 * `NextAiringEpisodeSchema` is a string representing the GraphQL schema for a next airing episode.
 * It includes the airing time, time until airing, and the episode number.
 */
export const NextAiringEpisodeSchema = `
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
`
