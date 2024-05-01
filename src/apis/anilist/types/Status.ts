/**
 * `MediaStatus` is a type that represents the status of a media.
 * It can be one of the following: 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'.
 */
export type MediaStatus = 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS'

/**
 * `MediaStatusMappings` is a mapping of `MediaStatus` enum values to their corresponding string values.
 * It can be one of the following: 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'.
 */
export const MediaStatusMappings = [
  'FINISHED',
  'RELEASING',
  'NOT_YET_RELEASED',
  'CANCELLED',
  'HIATUS'
]

/**
 * `MediaListStatus` is a type that represents the status of a media list.
 * It can be one of the following: 'CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', 'REPEATING'.
 */
export type MediaListStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING'

/**
 * `MediaListStatusMappings` is a mapping of `MediaListStatus` enum values to their corresponding string values.
 * It can be one of the following: 'CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', 'REPEATING'.
 */
export const MediaListStatusMappings = [
  'CURRENT',
  'PLANNING',
  'COMPLETED',
  'DROPPED',
  'PAUSED',
  'REPEATING'
]
