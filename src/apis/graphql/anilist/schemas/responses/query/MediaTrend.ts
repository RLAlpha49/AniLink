import { MediaSchema } from "./Media";

/**
 * {@link MediaTrendSchema} is a constant representing the GraphQL schema for a media trend query.
 * It includes the media's id, date, trending status, average score, popularity, in progress status, releasing status, episode number, and media of type `Media`.
 * @see https://docs.anilist.co/reference/object/mediatrend
 */
export const MediaTrendSchema = `
  mediaId
  date
  trending
  averageScore
  popularity
  inProgress
  releasing
  episode
  media {
    ${MediaSchema}
  }
`;
