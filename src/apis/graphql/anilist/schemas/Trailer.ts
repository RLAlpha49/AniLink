/**
 * {@link TrailerSchema} is the media-trailer selection: the trailer id, the site hosting
 * it, and its thumbnail.
 * @see https://docs.anilist.co/reference/object/mediatrailer
 */
export const TrailerSchema = `
  trailer {
    id
    site
    thumbnail
  }
`;
