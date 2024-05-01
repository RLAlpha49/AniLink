/**
 * `ActivitySort` is a type that represents the sorting options for the `Activity` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'PINNED'.
 */
export type ActivitySort = 'ID' | 'ID_DESC' | 'PINNED'

/**
 * `ActivitySortMappings` is a mapping of `ActivitySort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'PINNED'.
 */
export const ActivitySortMappings = [
  'ID',
  'ID_DESC',
  'PINNED'
]

/**
 * `AiringSort` is a type that represents the sorting options for the `MediaTrend` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'TIME', 'TIME_DESC', 'EPISODE', 'EPISODE_DESC'.
 */
export type AiringSort = 'ID' | 'ID_DESC' | 'MEDIA_ID' | 'MEDIA_ID_DESC' | 'TIME' | 'TIME_DESC' | 'EPISODE' | 'EPISODE_DESC'

/**
 * `AiringSortMappings` is a mapping of `AiringSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'TIME', 'TIME_DESC', 'EPISODE', 'EPISODE_DESC'.
 */
export const AiringSortMappings = [
  'ID',
  'ID_DESC',
  'MEDIA_ID',
  'MEDIA_ID_DESC',
  'TIME',
  'TIME_DESC',
  'EPISODE',
  'EPISODE_DESC'
]