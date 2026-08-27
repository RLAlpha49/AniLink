/**
 * {@link NextAiringEpisodeSchema} is a string representing the GraphQL schema for a next airing episode.
 * It includes the airing time, time until airing, and the episode number.
 * @see https://docs.anilist.co/reference/object/airingschedule
 */
export const NextAiringEpisodeSchema = `
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
`;
