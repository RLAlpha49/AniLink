/**
 * {@link CoverImageSchema} is the media cover-image selection: all three sizes plus the
 * dominant `color`, interpolated by the media fragments.
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
