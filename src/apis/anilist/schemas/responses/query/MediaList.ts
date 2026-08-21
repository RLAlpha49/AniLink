import { FuzzyDateSchema } from "../../FuzzyDate";
import { MediaSchema } from "./Media";

/**
 * `MediaListSchema` is a constant representing the GraphQL schema for a media list query.
 * It includes the id, user id, media id, status, score, progress, progress volumes, repeat, priority, private status, notes, hidden from status lists status, custom lists, advanced scores, started at date, completed at date, updated at timestamp, created at timestamp, media, and user.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export const MediaListSchema = `
  id
  userId
  mediaId
  status
  score (format: $scoreFormat)
  progress
  progressVolumes
  repeat
  priority
  private
  notes
  hiddenFromStatusLists
  customLists (asArray: $asArray)
  advancedScores
  startedAt {
    ${FuzzyDateSchema}
  }
  completedAt {
    ${FuzzyDateSchema}
  }
  updatedAt
  createdAt
  media {
    ${MediaSchema}
  }
`;
