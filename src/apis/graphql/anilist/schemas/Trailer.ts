/**
 * `TrailerSchema` is a string representing the GraphQL schema for a trailer.
 * It includes the id, site, and thumbnail.
 * @see https://docs.anilist.co/reference/object/mediatrailer
 */
export const TrailerSchema = `
  trailer {
    id
    site
    thumbnail
  }
`;
