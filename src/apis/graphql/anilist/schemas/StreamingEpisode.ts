/**
 * {@link StreamingEpisodeSchema} is the streaming-episode selection of a media: where each
 * episode can be watched, with its title and thumbnail.
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
