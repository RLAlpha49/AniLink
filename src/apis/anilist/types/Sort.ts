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
