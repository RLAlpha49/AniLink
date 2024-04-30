/**
 * `MediaListStatus` is a type representing the status of a media list.
 * It can be one of the following: 'CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', 'REPEATING'.
 */
export type MediaListStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING'

/**
 * `MediaListStatusMappings` is a constant that maps the `MediaListStatus` values to their expected types.
 * The values are mapped to 'string'.
 */
export const MediaListStatusMappings = [
  'CURRENT',
  'PLANNING',
  'COMPLETED',
  'DROPPED',
  'PAUSED',
  'REPEATING'
]
