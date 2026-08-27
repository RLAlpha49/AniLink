/**
 * {@link StreamingEpisodeSchema} is a string representing the GraphQL schema for a streaming episode.
 * It includes the title, thumbnail, url, and site.
 * @see https://docs.anilist.co/reference/object/mediastreamingepisode
 */
export const StreamingEpisodeSchema = `
  streamingEpisodes {
    title
    thumbnail
    url
    site
  }
`;
