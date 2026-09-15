/**
 * {@link TagSchema} is the media-tag selection: a tag's identity, its spoiler/adult flags,
 * and its relevance `rank` for the media being queried.
 * @see https://docs.anilist.co/reference/object/mediatag
 */
export const TagSchema = `
  id
  name
  description
  category
  rank
  isGeneralSpoiler
  isMediaSpoiler
  isAdult
  userId
`;
