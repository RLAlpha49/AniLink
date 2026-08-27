/**
 * {@link TagSchema} is a string representing the GraphQL schema for a tag.
 * It includes the id, name, description, category, rank, isGeneralSpoiler, isMediaSpoiler, isAdult, and userId.
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
