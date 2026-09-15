import { MediaSchema } from "./Media";

/**
 * {@link AiringScheduleSchema} is the airing-schedule response selection: one episode's
 * airing time and countdown, with the media it belongs to. The airing-schedule queries
 * send it.
 * @see https://docs.anilist.co/reference/object/airingschedule
 */
export const AiringScheduleSchema = `
  id
  airingAt
  timeUntilAiring
  episode
  mediaId
  media {
    ${MediaSchema}
  }
`;
