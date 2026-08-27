/**
 * {@link CoverImageSchema} is a string representing the GraphQL schema for a cover image.
 * It includes the extra large, large, medium size images and color.
 * @see https://docs.anilist.co/reference/object/mediacoverimage
 */
export const CoverImageSchema = `
  coverImage {
    extraLarge
    large
    medium
    color
  }
`;
