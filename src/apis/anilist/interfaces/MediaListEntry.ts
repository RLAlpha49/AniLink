/**
 * `MediaListStatus` is a type representing the status of a media list.
 * It can be 'CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', or 'REPEATING'.
 */
export type MediaListStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING'

/**
 * `MediaListEntry` is an interface representing an entry in a media list.
 * It includes the id and status each having their own properties.
 */
export interface MediaListEntry {
  /**
   * `id` is a number representing the unique identifier of the media list entry.
   */
  id: number

  /**
   * `status` is a string representing the status of the media list entry.
   */
  status: string
}

/**
 * `MediaListEntrySchema` is a string representing the GraphQL schema for a media list entry.
 * It includes the id and status.
 */
export const MediaListEntrySchema = `
  mediaListEntry {
    id
    status
  }
`
