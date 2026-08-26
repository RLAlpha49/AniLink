/**
 * `MediaListEntrySchema` is a string representing the GraphQL schema for a media list entry.
 * It includes the id and status.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export const MediaListEntrySchema = `
  mediaListEntry {
    id
    status
  }
`;
