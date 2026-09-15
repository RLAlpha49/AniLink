/**
 * {@link TitleSchema} is the media-title selection: the title in romaji, English, the
 * native language, and the user's preferred language.
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
