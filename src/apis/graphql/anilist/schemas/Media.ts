/**
 * {@link MediaListEntrySchema} is the viewer's own list entry for a media (`id` and
 * `status`), interpolated by the media fragments so a media response can carry the
 * caller's list state.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export const MediaListEntrySchema = `
  mediaListEntry {
    id
    status
  }
`;
