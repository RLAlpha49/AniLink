/**
 * {@link ExternalLinkSchema} is a string representing the GraphQL schema for an external link.
 * It includes the id, url, and site.
 * @see https://docs.anilist.co/reference/object/mediaexternallink
 */
export const ExternalLinkSchema = `
  externalLinks {
    id
    url
    site
  }
`;
