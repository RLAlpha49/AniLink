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
 * `MediaListSort` is a type that represents the sorting options for the `MediaList` query.
 * It can be one of the following: 'MEDIA_ID', 'MEDIA_ID_DESC', 'SCORE', 'SCORE_DESC', 'STATUS', 'STATUS_DESC', 'PROGRESS', 'PROGRESS_DESC', 'PROGRESS_VOLUMES', 'PROGRESS_VOLUMES_DESC', 'REPEAT', 'REPEAT_DESC', 'PRIORITY', 'PRIORITY_DESC', 'STARTED_ON', 'STARTED_ON_DESC', 'FINISHED_ON', 'FINISHED_ON_DESC', 'ADDED_TIME', 'ADDED_TIME_DESC', 'UPDATED_TIME', 'UPDATED_TIME_DESC', 'MEDIA_TITLE_ROMAJI', 'MEDIA_TITLE_ROMAJI_DESC', 'MEDIA_TITLE_ENGLISH', 'MEDIA_TITLE_ENGLISH_DESC', 'MEDIA_TITLE_NATIVE', 'MEDIA_TITLE_NATIVE_DESC', 'MEDIA_POPULARITY', 'MEDIA_POPULARITY_DESC'
 */
export type MediaListSort = 'MEDIA_ID' | 'MEDIA_ID_DESC' | 'SCORE' | 'SCORE_DESC' | 'STATUS' | 'STATUS_DESC' | 'PROGRESS' | 'PROGRESS_DESC' | 'PROGRESS_VOLUMES' | 'PROGRESS_VOLUMES_DESC' | 'REPEAT' | 'REPEAT_DESC' | 'PRIORITY' | 'PRIORITY_DESC' | 'STARTED_ON' | 'STARTED_ON_DESC' | 'FINISHED_ON' | 'FINISHED_ON_DESC' | 'ADDED_TIME' | 'ADDED_TIME_DESC' | 'UPDATED_TIME' | 'UPDATED_TIME_DESC' | 'MEDIA_TITLE_ROMAJI' | 'MEDIA_TITLE_ROMAJI_DESC' | 'MEDIA_TITLE_ENGLISH' | 'MEDIA_TITLE_ENGLISH_DESC' | 'MEDIA_TITLE_NATIVE' | 'MEDIA_TITLE_NATIVE_DESC' | 'MEDIA_POPULARITY' | 'MEDIA_POPULARITY_DESC'

/**
 * `MediaListSortMappings` is a mapping of `MediaListSort` enum values to their corresponding string values.
 * It can be one of the following: 'MEDIA_ID', 'MEDIA_ID_DESC', 'SCORE', 'SCORE_DESC', 'STATUS', 'STATUS_DESC', 'PROGRESS', 'PROGRESS_DESC', 'PROGRESS_VOLUMES', 'PROGRESS_VOLUMES_DESC', 'REPEAT', 'REPEAT_DESC', 'PRIORITY', 'PRIORITY_DESC', 'STARTED_ON', 'STARTED_ON_DESC', 'FINISHED_ON', 'FINISHED_ON_DESC', 'ADDED_TIME', 'ADDED_TIME_DESC', 'UPDATED_TIME', 'UPDATED_TIME_DESC', 'MEDIA_TITLE_ROMAJI', 'MEDIA_TITLE_ROMAJI_DESC', 'MEDIA_TITLE_ENGLISH', 'MEDIA_TITLE_ENGLISH_DESC', 'MEDIA_TITLE_NATIVE', 'MEDIA_TITLE_NATIVE_DESC', 'MEDIA_POPULARITY', 'MEDIA_POPULARITY_DESC'
 */
export const MediaListSortMappings = [
  'MEDIA_ID',
  'MEDIA_ID_DESC',
  'SCORE',
  'SCORE_DESC',
  'STATUS',
  'STATUS_DESC',
  'PROGRESS',
  'PROGRESS_DESC',
  'PROGRESS_VOLUMES',
  'PROGRESS_VOLUMES_DESC',
  'REPEAT',
  'REPEAT_DESC',
  'PRIORITY',
  'PRIORITY_DESC',
  'STARTED_ON',
  'STARTED_ON_DESC',
  'FINISHED_ON',
  'FINISHED_ON_DESC',
  'ADDED_TIME',
  'ADDED_TIME_DESC',
  'UPDATED_TIME',
  'UPDATED_TIME_DESC',
  'MEDIA_TITLE_ROMAJI',
  'MEDIA_TITLE_ROMAJI_DESC',
  'MEDIA_TITLE_ENGLISH',
  'MEDIA_TITLE_ENGLISH_DESC',
  'MEDIA_TITLE_NATIVE',
  'MEDIA_TITLE_NATIVE_DESC',
  'MEDIA_POPULARITY',
  'MEDIA_POPULARITY_DESC'
]

/**
 * `MediaTrendSort` is a type that represents the sorting options for the `MediaTrend` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'DATE', 'DATE_DESC', 'SCORE', 'SCORE_DESC', 'POPULARITY', 'POPULARITY_DESC', 'TRENDING', 'TRENDING_DESC', 'EPISODE', 'EPISODE_DESC'.
 */
export type MediaTrendSort = 'ID' | 'ID_DESC' | 'MEDIA_ID' | 'MEDIA_ID_DESC' | 'DATE' | 'DATE_DESC' | 'SCORE' | 'SCORE_DESC' | 'POPULARITY' | 'POPULARITY_DESC' | 'TRENDING' | 'TRENDING_DESC' | 'EPISODE' | 'EPISODE_DESC'

/**
 * `MediaTrendSortMappings` is a mapping of `MediaTrendSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'DATE', 'DATE_DESC', 'SCORE', 'SCORE_DESC', 'POPULARITY', 'POPULARITY_DESC', 'TRENDING', 'TRENDING_DESC', 'EPISODE', 'EPISODE_DESC'.
 */
export const MediaTrendSortMappings = [
  'ID',
  'ID_DESC',
  'MEDIA_ID',
  'MEDIA_ID_DESC',
  'DATE',
  'DATE_DESC',
  'SCORE',
  'SCORE_DESC',
  'POPULARITY',
  'POPULARITY_DESC',
  'TRENDING',
  'TRENDING_DESC',
  'EPISODE',
  'EPISODE_DESC'
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

/**
 * `RecommendationSort` is a type that represents the sorting options for the `Recommendation` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'RATING', 'RATING_DESC'.
 */
export type RecommendationSort = 'ID' | 'ID_DESC' | 'RATING' | 'RATING_DESC'

/**
 * `RecommendationSortMappings` is a mapping of `RecommendationSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'RATING', 'RATING_DESC'.
 */
export const RecommendationSortMappings = [
  'ID',
  'ID_DESC',
  'RATING',
  'RATING_DESC'
]

/**
 * `ReviewSort` is a type that represents the sorting options for the `Review` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'SCORE', 'SCORE_DESC', 'RATING', 'RATING_DESC', 'CREATED_AT', 'CREATED_AT_DESC', 'UPDATED_AT', 'UPDATED_AT_DESC'.
 */
export type ReviewSort = 'ID' | 'ID_DESC' | 'MEDIA_ID' | 'MEDIA_ID_DESC' | 'SCORE' | 'SCORE_DESC' | 'RATING' | 'RATING_DESC' | 'CREATED_AT' | 'CREATED_AT_DESC' | 'UPDATED_AT' | 'UPDATED_AT_DESC'

/**
 * `ReviewSortMappings` is a mapping of `ReviewSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'SCORE', 'SCORE_DESC', 'RATING', 'RATING_DESC', 'CREATED_AT', 'CREATED_AT_DESC', 'UPDATED_AT', 'UPDATED_AT_DESC'.
 */
export const ReviewSortMappings = [
  'ID',
  'ID_DESC',
  'MEDIA_ID',
  'MEDIA_ID_DESC',
  'SCORE',
  'SCORE_DESC',
  'RATING',
  'RATING_DESC',
  'CREATED_AT',
  'CREATED_AT_DESC',
  'UPDATED_AT',
  'UPDATED_AT_DESC'
]

/**
 * `SiteTrendSort` is a type that represents the sorting options for the `SiteTrend` query.
 * It can be one of the following: 'DATE', 'DATE_DESC', 'COUNT', 'COUNT_DESC', 'CHANGE', 'CHANGE_DESC'.
 */
export type SiteTrendSort = 'DATE' | 'DATE_DESC' | 'COUNT' | 'COUNT_DESC' | 'CHANGE' | 'CHANGE_DESC'

/**
 * `SiteTrendSortMappings` is a mapping of `SiteTrendSort` enum values to their corresponding string values.
 * It can be one of the following: 'DATE', 'DATE_DESC', 'COUNT', 'COUNT_DESC', 'CHANGE', 'CHANGE_DESC'.
 */
export const SiteTrendSortMappings = [
  'DATE',
  'DATE_DESC',
  'COUNT',
  'COUNT_DESC',
  'CHANGE',
  'CHANGE_DESC'
]

/**
 * `StaffSort` is a type that represents the sorting options for the `Staff` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'ROLE', 'ROLE_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC', 'RELEVANCE'.
 */
export type StaffSort = 'ID' | 'ID_DESC' | 'ROLE' | 'ROLE_DESC' | 'SEARCH_MATCH' | 'FAVOURITES' | 'FAVOURITES_DESC' | 'RELEVANCE'

/**
 * `StaffSortMappings` is a mapping of `StaffSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'ROLE', 'ROLE_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC', 'RELEVANCE'.
 */
export const StaffSortMappings = [
  'ID',
  'ID_DESC',
  'ROLE',
  'ROLE_DESC',
  'SEARCH_MATCH',
  'FAVOURITES',
  'FAVOURITES_DESC',
  'RELEVANCE'
]