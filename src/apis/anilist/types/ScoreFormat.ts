/**
 * `ScoreFormat` is a type representing the scoring format for a media list.
 * It can be one of the following: 'POINT_100', 'POINT_10_DECIMAL', 'POINT_10', 'POINT_5', 'POINT_3'.
 */
export type ScoreFormat = 'POINT_100' | 'POINT_10_DECIMAL' | 'POINT_10' | 'POINT_5' | 'POINT_3'

/**
 * `ScoreFormatMapping` is a mapping of `ScoreFormat` values to their string representations.
 * It can be one of the following: 'POINT_100', 'POINT_10_DECIMAL', 'POINT_10', 'POINT_5', 'POINT_3'.
 */
export const ScoreFormatMapping = [
  'POINT_100',
  'POINT_10_DECIMAL',
  'POINT_10',
  'POINT_5',
  'POINT_3'
]
