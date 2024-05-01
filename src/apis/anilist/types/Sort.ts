/**
 * `MediaSort` is a type that represents the sorting options for the `Media` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'TITLE_ROMAJI', 'TITLE_ROMAJI_DESC', 'TITLE_ENGLISH', 'TITLE_ENGLISH_DESC', 'TITLE_NATIVE', 'TITLE_NATIVE_DESC', 'TYPE', 'TYPE_DESC', 'FORMAT', 'FORMAT_DESC', 'START_DATE', 'START_DATE_DESC', 'END_DATE', 'END_DATE_DESC', 'SCORE', 'SCORE_DESC', 'POPULARITY', 'POPULARITY_DESC', 'TRENDING', 'TRENDING_DESC', 'EPISODES', 'EPISODES_DESC', 'DURATION', 'DURATION_DESC', 'STATUS', 'STATUS_DESC', 'CHAPTERS', 'CHAPTERS_DESC', 'VOLUMES', 'VOLUMES_DESC', 'UPDATED_AT', 'UPDATED_AT_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC'
 */
export type MediaSort = 'ID' | 'ID_DESC' | 'TITLE_ROMAJI' | 'TITLE_ROMAJI_DESC' | 'TITLE_ENGLISH' | 'TITLE_ENGLISH_DESC' | 'TITLE_NATIVE' | 'TITLE_NATIVE_DESC' | 'TYPE' | 'TYPE_DESC' | 'FORMAT' | 'FORMAT_DESC' | 'START_DATE' | 'START_DATE_DESC' | 'END_DATE' | 'END_DATE_DESC' | 'SCORE' | 'SCORE_DESC' | 'POPULARITY' | 'POPULARITY_DESC' | 'TRENDING' | 'TRENDING_DESC' | 'EPISODES' | 'EPISODES_DESC' | 'DURATION' | 'DURATION_DESC' | 'STATUS' | 'STATUS_DESC' | 'CHAPTERS' | 'CHAPTERS_DESC' | 'VOLUMES' | 'VOLUMES_DESC' | 'UPDATED_AT' | 'UPDATED_AT_DESC' | 'SEARCH_MATCH' | 'FAVOURITES' | 'FAVOURITES_DESC'

/**
 * `MediaSortMappings` is a mapping of `MediaSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'TITLE_ROMAJI', 'TITLE_ROMAJI_DESC', 'TITLE_ENGLISH', 'TITLE_ENGLISH_DESC', 'TITLE_NATIVE', 'TITLE_NATIVE_DESC', 'TYPE', 'TYPE_DESC', 'FORMAT', 'FORMAT_DESC', 'START_DATE', 'START_DATE_DESC', 'END_DATE', 'END_DATE_DESC', 'SCORE', 'SCORE_DESC', 'POPULARITY', 'POPULARITY_DESC', 'TRENDING', 'TRENDING_DESC', 'EPISODES', 'EPISODES_DESC', 'DURATION', 'DURATION_DESC', 'STATUS', 'STATUS_DESC', 'CHAPTERS', 'CHAPTERS_DESC', 'VOLUMES', 'VOLUMES_DESC', 'UPDATED_AT', 'UPDATED_AT_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC'
 */
export const MediaSortMappings = [
  'ID',
  'ID_DESC',
  'TITLE_ROMAJI',
  'TITLE_ROMAJI_DESC',
  'TITLE_ENGLISH',
  'TITLE_ENGLISH_DESC',
  'TITLE_NATIVE',
  'TITLE_NATIVE_DESC',
  'TYPE',
  'TYPE_DESC',
  'FORMAT',
  'FORMAT_DESC',
  'START_DATE',
  'START_DATE_DESC',
  'END_DATE',
  'END_DATE_DESC',
  'SCORE',
  'SCORE_DESC',
  'POPULARITY',
  'POPULARITY_DESC',
  'TRENDING',
  'TRENDING_DESC',
  'EPISODES',
  'EPISODES_DESC',
  'DURATION',
  'DURATION_DESC',
  'STATUS',
  'STATUS_DESC',
  'CHAPTERS',
  'CHAPTERS_DESC',
  'VOLUMES',
  'VOLUMES_DESC',
  'UPDATED_AT',
  'UPDATED_AT_DESC',
  'SEARCH_MATCH',
  'FAVOURITES',
  'FAVOURITES_DESC'
]

/**
 * `UserSort` is a type that represents the sorting options for the `User` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'USERNAME', 'USERNAME_DESC', 'WATCHED_TIME', 'WATCHED_TIME_DESC', 'CHAPTERS_READ', 'CHAPTERS_READ_DESC', 'SEARCH_MATCH'.
 */
export type UserSort = 'ID' | 'ID_DESC' | 'USERNAME' | 'USERNAME_DESC' | 'WATCHED_TIME' | 'WATCHED_TIME_DESC' | 'CHAPTERS_READ' | 'CHAPTERS_READ_DESC' | 'SEARCH_MATCH'

/**
 * `UserSortMappings` is a mapping of `UserSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'USERNAME', 'USERNAME_DESC', 'WATCHED_TIME', 'WATCHED_TIME_DESC', 'CHAPTERS_READ', 'CHAPTERS_READ_DESC', 'SEARCH_MATCH'.
 */
export const UserSortMappings = [
  'ID',
  'ID_DESC',
  'USERNAME',
  'USERNAME_DESC',
  'WATCHED_TIME',
  'WATCHED_TIME_DESC',
  'CHAPTERS_READ',
  'CHAPTERS_READ_DESC',
  'SEARCH_MATCH'
]

/**
 * `UserStatisticSort` is a type that represents the sorting options for the `UserStatistic` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'COUNT', 'COUNT_DESC', 'PROGRESS', 'PROGRESS_DESC', 'MEAN_SCORE', 'MEAN_SCORE_DESC'.
 */
export type UserStatisticSort = 'ID' | 'ID_DESC' | 'COUNT' | 'COUNT_DESC' | 'PROGRESS' | 'PROGRESS_DESC' | 'MEAN_SCORE' | 'MEAN_SCORE_DESC'

/**
 * `UserStatisticSortMappings` is a mapping of `UserStatisticSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'COUNT', 'COUNT_DESC', 'PROGRESS', 'PROGRESS_DESC', 'MEAN_SCORE', 'MEAN_SCORE_DESC'.
 */
export const UserStatisticSortMappings = [
  'ID',
  'ID_DESC',
  'COUNT',
  'COUNT_DESC',
  'PROGRESS',
  'PROGRESS_DESC',
  'MEAN_SCORE',
  'MEAN_SCORE_DESC'
]

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

/**
 * `CharacterSort` is a type that represents the sorting options for the `Character` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'ROLE', 'ROLE_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC', 'RELEVANCE'.
 */
export type CharacterSort = 'ID' | 'ID_DESC' | 'ROLE' | 'ROLE_DESC' | 'SEARCH_MATCH' | 'FAVOURITES' | 'FAVOURITES_DESC' | 'RELEVANCE'

/**
 * `CharacterSortMappings` is a mapping of `CharacterSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'ROLE', 'ROLE_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC', 'RELEVANCE'.
 */
export const CharacterSortMappings = [
  'ID',
  'ID_DESC',
  'ROLE',
  'ROLE_DESC',
  'SEARCH_MATCH',
  'FAVOURITES',
  'FAVOURITES_DESC',
  'RELEVANCE'
]