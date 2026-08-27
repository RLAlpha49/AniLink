/**
 * {@link TitleSchema} is a string representing the GraphQL schema for a title.
 * It includes the romaji, english, native, and userPreferred.
 * @see https://docs.anilist.co/reference/object/mediatitle
 */
export const TitleSchema = `
  title {
    romaji
    english
    native
    userPreferred
  }
`;
