/**
 * {@link NextAiringEpisodeSchema} is the next-episode selection of a media: the airing
 * timestamp, the seconds until it airs, and the episode number.
 * @see https://docs.anilist.co/reference/object/airingschedule
 */
export const NextAiringEpisodeSchema = `
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
`;
