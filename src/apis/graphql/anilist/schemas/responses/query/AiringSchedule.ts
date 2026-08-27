import { MediaSchema } from "./Media";

/**
 * {@link AiringScheduleSchema} is a constant representing the GraphQL schema for an airing schedule query.
 * It includes the id, airing time, time until airing, episode number, media id, and the media schema.
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
