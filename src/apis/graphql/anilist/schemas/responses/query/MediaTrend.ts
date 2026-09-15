import { MediaSchema } from "./Media";

/**
 * {@link MediaTrendSchema} is the media-trend response selection: one day of a media's
 * trending snapshot, with the media it describes. The media-trend queries send it.
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
