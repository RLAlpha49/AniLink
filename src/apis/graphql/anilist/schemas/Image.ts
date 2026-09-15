/**
 * {@link ImageSchema} is the shared image selection (`large`/`medium` sizes) used for the
 * `image` field of characters, staff, and their nested entities. AniList types the
 * field per entity (`CharacterImage`, `StaffImage`); the selected keys are the same.
 * @see https://docs.anilist.co/reference/object/characterimage
 * @see https://docs.anilist.co/reference/object/staffimage
 */
export const ImageSchema = `
  image {
    large
    medium
  }
`;
