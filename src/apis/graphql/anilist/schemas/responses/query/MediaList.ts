import { FuzzyDateSchema } from "../../FuzzyDate";
import { MediaSchema } from "./Media";

/**
 * {@link MediaListSchema} is the list-entry response selection: the viewer's status,
 * score, and progress on one media, with the media itself. The list queries send it.
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
