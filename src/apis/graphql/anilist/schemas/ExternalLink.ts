/**
 * {@link ExternalLinkSchema} is the external-link selection (`id`/`url`/`site`),
 * interpolated wherever a response lists a media's off-site links.
 * @see https://docs.anilist.co/reference/object/mediaexternallink
 */
export const ExternalLinkSchema = `
  externalLinks {
    id
    url
    site
  }
`;
