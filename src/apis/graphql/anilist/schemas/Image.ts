/**
 * `ImageSchema` is a string representing the GraphQL schema for an image.
 * It includes the large and medium size images.
 * @see https://docs.anilist.co/reference/object/characterimage
 */
export const ImageSchema = `
  image {
    large
    medium
  }
`;
