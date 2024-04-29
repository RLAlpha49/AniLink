import { ScoreFormat } from '../types/ScoreFormat'

/**
 * `MediaListOptionsInput` is an interface representing the options for a media list.
 * It includes the score format, row order, anime list, and manga list each having their own properties.
 */
export interface MediaListOptionsInput {
  /**
   * `scoreFormat` is a value of type `ScoreFormat` representing the score format of the media list.
   */
  scoreFormat: ScoreFormat

  /**
   * `rowOrder` is a string representing the row order of the media list.
   */
  rowOrder: string

  /**
   * `animeList` is an object representing the anime list of the media list.
   */
  animeList: any

  /**
   * `mangaList` is an object representing the manga list of the media list.
   */
  mangaList: any
}

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
