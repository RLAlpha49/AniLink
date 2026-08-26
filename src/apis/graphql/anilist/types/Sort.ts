/**
 * `MediaSort` is a type that represents the sorting options for the `Media` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'TITLE_ROMAJI', 'TITLE_ROMAJI_DESC', 'TITLE_ENGLISH', 'TITLE_ENGLISH_DESC', 'TITLE_NATIVE', 'TITLE_NATIVE_DESC', 'TYPE', 'TYPE_DESC', 'FORMAT', 'FORMAT_DESC', 'START_DATE', 'START_DATE_DESC', 'END_DATE', 'END_DATE_DESC', 'SCORE', 'SCORE_DESC', 'POPULARITY', 'POPULARITY_DESC', 'TRENDING', 'TRENDING_DESC', 'EPISODES', 'EPISODES_DESC', 'DURATION', 'DURATION_DESC', 'STATUS', 'STATUS_DESC', 'CHAPTERS', 'CHAPTERS_DESC', 'VOLUMES', 'VOLUMES_DESC', 'UPDATED_AT', 'UPDATED_AT_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC'
 * @see https://docs.anilist.co/reference/enum/mediasort
 */
export type MediaSort =
    | "ID"
    | "ID_DESC"
    | "TITLE_ROMAJI"
    | "TITLE_ROMAJI_DESC"
    | "TITLE_ENGLISH"
    | "TITLE_ENGLISH_DESC"
    | "TITLE_NATIVE"
    | "TITLE_NATIVE_DESC"
    | "TYPE"
    | "TYPE_DESC"
    | "FORMAT"
    | "FORMAT_DESC"
    | "START_DATE"
    | "START_DATE_DESC"
    | "END_DATE"
    | "END_DATE_DESC"
    | "SCORE"
    | "SCORE_DESC"
    | "POPULARITY"
    | "POPULARITY_DESC"
    | "TRENDING"
    | "TRENDING_DESC"
    | "EPISODES"
    | "EPISODES_DESC"
    | "DURATION"
    | "DURATION_DESC"
    | "STATUS"
    | "STATUS_DESC"
    | "CHAPTERS"
    | "CHAPTERS_DESC"
    | "VOLUMES"
    | "VOLUMES_DESC"
    | "UPDATED_AT"
    | "UPDATED_AT_DESC"
    | "SEARCH_MATCH"
    | "FAVOURITES"
    | "FAVOURITES_DESC";

/**
 * `MediaSortMappings` is a mapping of `MediaSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'TITLE_ROMAJI', 'TITLE_ROMAJI_DESC', 'TITLE_ENGLISH', 'TITLE_ENGLISH_DESC', 'TITLE_NATIVE', 'TITLE_NATIVE_DESC', 'TYPE', 'TYPE_DESC', 'FORMAT', 'FORMAT_DESC', 'START_DATE', 'START_DATE_DESC', 'END_DATE', 'END_DATE_DESC', 'SCORE', 'SCORE_DESC', 'POPULARITY', 'POPULARITY_DESC', 'TRENDING', 'TRENDING_DESC', 'EPISODES', 'EPISODES_DESC', 'DURATION', 'DURATION_DESC', 'STATUS', 'STATUS_DESC', 'CHAPTERS', 'CHAPTERS_DESC', 'VOLUMES', 'VOLUMES_DESC', 'UPDATED_AT', 'UPDATED_AT_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC'
 * @see https://docs.anilist.co/reference/enum/mediasort
 */
export const MediaSortMappings: readonly MediaSort[] = [
    "ID",
    "ID_DESC",
    "TITLE_ROMAJI",
    "TITLE_ROMAJI_DESC",
    "TITLE_ENGLISH",
    "TITLE_ENGLISH_DESC",
    "TITLE_NATIVE",
    "TITLE_NATIVE_DESC",
    "TYPE",
    "TYPE_DESC",
    "FORMAT",
    "FORMAT_DESC",
    "START_DATE",
    "START_DATE_DESC",
    "END_DATE",
    "END_DATE_DESC",
    "SCORE",
    "SCORE_DESC",
    "POPULARITY",
    "POPULARITY_DESC",
    "TRENDING",
    "TRENDING_DESC",
    "EPISODES",
    "EPISODES_DESC",
    "DURATION",
    "DURATION_DESC",
    "STATUS",
    "STATUS_DESC",
    "CHAPTERS",
    "CHAPTERS_DESC",
    "VOLUMES",
    "VOLUMES_DESC",
    "UPDATED_AT",
    "UPDATED_AT_DESC",
    "SEARCH_MATCH",
    "FAVOURITES",
    "FAVOURITES_DESC",
];

/**
 * `MediaListSort` is a type that represents the sorting options for the `MediaList` query.
 * It can be one of the following: 'MEDIA_ID', 'MEDIA_ID_DESC', 'SCORE', 'SCORE_DESC', 'STATUS', 'STATUS_DESC', 'PROGRESS', 'PROGRESS_DESC', 'PROGRESS_VOLUMES', 'PROGRESS_VOLUMES_DESC', 'REPEAT', 'REPEAT_DESC', 'PRIORITY', 'PRIORITY_DESC', 'STARTED_ON', 'STARTED_ON_DESC', 'FINISHED_ON', 'FINISHED_ON_DESC', 'ADDED_TIME', 'ADDED_TIME_DESC', 'UPDATED_TIME', 'UPDATED_TIME_DESC', 'MEDIA_TITLE_ROMAJI', 'MEDIA_TITLE_ROMAJI_DESC', 'MEDIA_TITLE_ENGLISH', 'MEDIA_TITLE_ENGLISH_DESC', 'MEDIA_TITLE_NATIVE', 'MEDIA_TITLE_NATIVE_DESC', 'MEDIA_POPULARITY', 'MEDIA_POPULARITY_DESC'
 * @see https://docs.anilist.co/reference/enum/medialistsort
 */
export type MediaListSort =
    | "MEDIA_ID"
    | "MEDIA_ID_DESC"
    | "SCORE"
    | "SCORE_DESC"
    | "STATUS"
    | "STATUS_DESC"
    | "PROGRESS"
    | "PROGRESS_DESC"
    | "PROGRESS_VOLUMES"
    | "PROGRESS_VOLUMES_DESC"
    | "REPEAT"
    | "REPEAT_DESC"
    | "PRIORITY"
    | "PRIORITY_DESC"
    | "STARTED_ON"
    | "STARTED_ON_DESC"
    | "FINISHED_ON"
    | "FINISHED_ON_DESC"
    | "ADDED_TIME"
    | "ADDED_TIME_DESC"
    | "UPDATED_TIME"
    | "UPDATED_TIME_DESC"
    | "MEDIA_TITLE_ROMAJI"
    | "MEDIA_TITLE_ROMAJI_DESC"
    | "MEDIA_TITLE_ENGLISH"
    | "MEDIA_TITLE_ENGLISH_DESC"
    | "MEDIA_TITLE_NATIVE"
    | "MEDIA_TITLE_NATIVE_DESC"
    | "MEDIA_POPULARITY"
    | "MEDIA_POPULARITY_DESC";

/**
 * `MediaListSortMappings` is a mapping of `MediaListSort` enum values to their corresponding string values.
 * It can be one of the following: 'MEDIA_ID', 'MEDIA_ID_DESC', 'SCORE', 'SCORE_DESC', 'STATUS', 'STATUS_DESC', 'PROGRESS', 'PROGRESS_DESC', 'PROGRESS_VOLUMES', 'PROGRESS_VOLUMES_DESC', 'REPEAT', 'REPEAT_DESC', 'PRIORITY', 'PRIORITY_DESC', 'STARTED_ON', 'STARTED_ON_DESC', 'FINISHED_ON', 'FINISHED_ON_DESC', 'ADDED_TIME', 'ADDED_TIME_DESC', 'UPDATED_TIME', 'UPDATED_TIME_DESC', 'MEDIA_TITLE_ROMAJI', 'MEDIA_TITLE_ROMAJI_DESC', 'MEDIA_TITLE_ENGLISH', 'MEDIA_TITLE_ENGLISH_DESC', 'MEDIA_TITLE_NATIVE', 'MEDIA_TITLE_NATIVE_DESC', 'MEDIA_POPULARITY', 'MEDIA_POPULARITY_DESC'
 * @see https://docs.anilist.co/reference/enum/medialistsort
 */
export const MediaListSortMappings: readonly MediaListSort[] = [
    "MEDIA_ID",
    "MEDIA_ID_DESC",
    "SCORE",
    "SCORE_DESC",
    "STATUS",
    "STATUS_DESC",
    "PROGRESS",
    "PROGRESS_DESC",
    "PROGRESS_VOLUMES",
    "PROGRESS_VOLUMES_DESC",
    "REPEAT",
    "REPEAT_DESC",
    "PRIORITY",
    "PRIORITY_DESC",
    "STARTED_ON",
    "STARTED_ON_DESC",
    "FINISHED_ON",
    "FINISHED_ON_DESC",
    "ADDED_TIME",
    "ADDED_TIME_DESC",
    "UPDATED_TIME",
    "UPDATED_TIME_DESC",
    "MEDIA_TITLE_ROMAJI",
    "MEDIA_TITLE_ROMAJI_DESC",
    "MEDIA_TITLE_ENGLISH",
    "MEDIA_TITLE_ENGLISH_DESC",
    "MEDIA_TITLE_NATIVE",
    "MEDIA_TITLE_NATIVE_DESC",
    "MEDIA_POPULARITY",
    "MEDIA_POPULARITY_DESC",
];

/**
 * `MediaTrendSort` is a type that represents the sorting options for the `MediaTrend` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'DATE', 'DATE_DESC', 'SCORE', 'SCORE_DESC', 'POPULARITY', 'POPULARITY_DESC', 'TRENDING', 'TRENDING_DESC', 'EPISODE', 'EPISODE_DESC'.
 * @see https://docs.anilist.co/reference/enum/mediatrendsort
 */
export type MediaTrendSort =
    | "ID"
    | "ID_DESC"
    | "MEDIA_ID"
    | "MEDIA_ID_DESC"
    | "DATE"
    | "DATE_DESC"
    | "SCORE"
    | "SCORE_DESC"
    | "POPULARITY"
    | "POPULARITY_DESC"
    | "TRENDING"
    | "TRENDING_DESC"
    | "EPISODE"
    | "EPISODE_DESC";

/**
 * `MediaTrendSortMappings` is a mapping of `MediaTrendSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'DATE', 'DATE_DESC', 'SCORE', 'SCORE_DESC', 'POPULARITY', 'POPULARITY_DESC', 'TRENDING', 'TRENDING_DESC', 'EPISODE', 'EPISODE_DESC'.
 * @see https://docs.anilist.co/reference/enum/mediatrendsort
 */
export const MediaTrendSortMappings: readonly MediaTrendSort[] = [
    "ID",
    "ID_DESC",
    "MEDIA_ID",
    "MEDIA_ID_DESC",
    "DATE",
    "DATE_DESC",
    "SCORE",
    "SCORE_DESC",
    "POPULARITY",
    "POPULARITY_DESC",
    "TRENDING",
    "TRENDING_DESC",
    "EPISODE",
    "EPISODE_DESC",
];

/**
 * `UserSort` is a type that represents the sorting options for the `User` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'USERNAME', 'USERNAME_DESC', 'WATCHED_TIME', 'WATCHED_TIME_DESC', 'CHAPTERS_READ', 'CHAPTERS_READ_DESC', 'SEARCH_MATCH'.
 * @see https://docs.anilist.co/reference/enum/usersort
 */
export type UserSort =
    | "ID"
    | "ID_DESC"
    | "USERNAME"
    | "USERNAME_DESC"
    | "WATCHED_TIME"
    | "WATCHED_TIME_DESC"
    | "CHAPTERS_READ"
    | "CHAPTERS_READ_DESC"
    | "SEARCH_MATCH";

/**
 * `UserSortMappings` is a mapping of `UserSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'USERNAME', 'USERNAME_DESC', 'WATCHED_TIME', 'WATCHED_TIME_DESC', 'CHAPTERS_READ', 'CHAPTERS_READ_DESC', 'SEARCH_MATCH'.
 * @see https://docs.anilist.co/reference/enum/usersort
 */
export const UserSortMappings: readonly UserSort[] = [
    "ID",
    "ID_DESC",
    "USERNAME",
    "USERNAME_DESC",
    "WATCHED_TIME",
    "WATCHED_TIME_DESC",
    "CHAPTERS_READ",
    "CHAPTERS_READ_DESC",
    "SEARCH_MATCH",
];

/**
 * `UserStatisticSort` is a type that represents the sorting options for the `UserStatistic` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'COUNT', 'COUNT_DESC', 'PROGRESS', 'PROGRESS_DESC', 'MEAN_SCORE', 'MEAN_SCORE_DESC'.
 * @see https://docs.anilist.co/reference/enum/userstatisticssort
 */
export type UserStatisticSort =
    | "ID"
    | "ID_DESC"
    | "COUNT"
    | "COUNT_DESC"
    | "PROGRESS"
    | "PROGRESS_DESC"
    | "MEAN_SCORE"
    | "MEAN_SCORE_DESC";

/**
 * `UserStatisticSortMappings` is a mapping of `UserStatisticSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'COUNT', 'COUNT_DESC', 'PROGRESS', 'PROGRESS_DESC', 'MEAN_SCORE', 'MEAN_SCORE_DESC'.
 * @see https://docs.anilist.co/reference/enum/userstatisticssort
 */
export const UserStatisticSortMappings: readonly UserStatisticSort[] = [
    "ID",
    "ID_DESC",
    "COUNT",
    "COUNT_DESC",
    "PROGRESS",
    "PROGRESS_DESC",
    "MEAN_SCORE",
    "MEAN_SCORE_DESC",
];

/**
 * `ActivitySort` is a type that represents the sorting options for the `Activity` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'PINNED'.
 * @see https://docs.anilist.co/reference/enum/activitysort
 */
export type ActivitySort = "ID" | "ID_DESC" | "PINNED";

/**
 * `ActivitySortMappings` is a mapping of `ActivitySort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'PINNED'.
 * @see https://docs.anilist.co/reference/enum/activitysort
 */
export const ActivitySortMappings: readonly ActivitySort[] = ["ID", "ID_DESC", "PINNED"];

/**
 * `AiringSort` is a type that represents the sorting options for the `MediaTrend` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'TIME', 'TIME_DESC', 'EPISODE', 'EPISODE_DESC'.
 * @see https://docs.anilist.co/reference/enum/airingsort
 */
export type AiringSort =
    | "ID"
    | "ID_DESC"
    | "MEDIA_ID"
    | "MEDIA_ID_DESC"
    | "TIME"
    | "TIME_DESC"
    | "EPISODE"
    | "EPISODE_DESC";

/**
 * `AiringSortMappings` is a mapping of `AiringSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'TIME', 'TIME_DESC', 'EPISODE', 'EPISODE_DESC'.
 * @see https://docs.anilist.co/reference/enum/airingsort
 */
export const AiringSortMappings: readonly AiringSort[] = [
    "ID",
    "ID_DESC",
    "MEDIA_ID",
    "MEDIA_ID_DESC",
    "TIME",
    "TIME_DESC",
    "EPISODE",
    "EPISODE_DESC",
];

/**
 * `CharacterSort` is a type that represents the sorting options for the `Character` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'ROLE', 'ROLE_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC', 'RELEVANCE'.
 * @see https://docs.anilist.co/reference/enum/charactersort
 */
export type CharacterSort =
    | "ID"
    | "ID_DESC"
    | "ROLE"
    | "ROLE_DESC"
    | "SEARCH_MATCH"
    | "FAVOURITES"
    | "FAVOURITES_DESC"
    | "RELEVANCE";

/**
 * `CharacterSortMappings` is a mapping of `CharacterSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'ROLE', 'ROLE_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC', 'RELEVANCE'.
 * @see https://docs.anilist.co/reference/enum/charactersort
 */
export const CharacterSortMappings: readonly CharacterSort[] = [
    "ID",
    "ID_DESC",
    "ROLE",
    "ROLE_DESC",
    "SEARCH_MATCH",
    "FAVOURITES",
    "FAVOURITES_DESC",
    "RELEVANCE",
];

/**
 * `RecommendationSort` is a type that represents the sorting options for the `Recommendation` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'RATING', 'RATING_DESC'.
 * @see https://docs.anilist.co/reference/enum/recommendationsort
 */
export type RecommendationSort = "ID" | "ID_DESC" | "RATING" | "RATING_DESC";

/**
 * `RecommendationSortMappings` is a mapping of `RecommendationSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'RATING', 'RATING_DESC'.
 * @see https://docs.anilist.co/reference/enum/recommendationsort
 */
export const RecommendationSortMappings: readonly RecommendationSort[] = [
    "ID",
    "ID_DESC",
    "RATING",
    "RATING_DESC",
];

/**
 * `ReviewSort` is a type that represents the sorting options for the `Review` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'SCORE', 'SCORE_DESC', 'RATING', 'RATING_DESC', 'CREATED_AT', 'CREATED_AT_DESC', 'UPDATED_AT', 'UPDATED_AT_DESC'.
 * @see https://docs.anilist.co/reference/enum/reviewsort
 */
export type ReviewSort =
    | "ID"
    | "ID_DESC"
    | "MEDIA_ID"
    | "MEDIA_ID_DESC"
    | "SCORE"
    | "SCORE_DESC"
    | "RATING"
    | "RATING_DESC"
    | "CREATED_AT"
    | "CREATED_AT_DESC"
    | "UPDATED_AT"
    | "UPDATED_AT_DESC";

/**
 * `ReviewSortMappings` is a mapping of `ReviewSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'MEDIA_ID', 'MEDIA_ID_DESC', 'SCORE', 'SCORE_DESC', 'RATING', 'RATING_DESC', 'CREATED_AT', 'CREATED_AT_DESC', 'UPDATED_AT', 'UPDATED_AT_DESC'.
 * @see https://docs.anilist.co/reference/enum/reviewsort
 */
export const ReviewSortMappings: readonly ReviewSort[] = [
    "ID",
    "ID_DESC",
    "MEDIA_ID",
    "MEDIA_ID_DESC",
    "SCORE",
    "SCORE_DESC",
    "RATING",
    "RATING_DESC",
    "CREATED_AT",
    "CREATED_AT_DESC",
    "UPDATED_AT",
    "UPDATED_AT_DESC",
];

/**
 * `SiteTrendSort` is a type that represents the sorting options for the `SiteTrend` query.
 * It can be one of the following: 'DATE', 'DATE_DESC', 'COUNT', 'COUNT_DESC', 'CHANGE', 'CHANGE_DESC'.
 * @see https://docs.anilist.co/reference/enum/sitetrendsort
 */
export type SiteTrendSort =
    "DATE" | "DATE_DESC" | "COUNT" | "COUNT_DESC" | "CHANGE" | "CHANGE_DESC";

/**
 * `SiteTrendSortMappings` is a mapping of `SiteTrendSort` enum values to their corresponding string values.
 * It can be one of the following: 'DATE', 'DATE_DESC', 'COUNT', 'COUNT_DESC', 'CHANGE', 'CHANGE_DESC'.
 * @see https://docs.anilist.co/reference/enum/sitetrendsort
 */
export const SiteTrendSortMappings: readonly SiteTrendSort[] = [
    "DATE",
    "DATE_DESC",
    "COUNT",
    "COUNT_DESC",
    "CHANGE",
    "CHANGE_DESC",
];

/**
 * `StaffSort` is a type that represents the sorting options for the `Staff` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'ROLE', 'ROLE_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC', 'RELEVANCE'.
 * @see https://docs.anilist.co/reference/enum/staffsort
 */
export type StaffSort =
    | "ID"
    | "ID_DESC"
    | "ROLE"
    | "ROLE_DESC"
    | "SEARCH_MATCH"
    | "FAVOURITES"
    | "FAVOURITES_DESC"
    | "RELEVANCE";

/**
 * `StaffSortMappings` is a mapping of `StaffSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'ROLE', 'ROLE_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC', 'RELEVANCE'.
 * @see https://docs.anilist.co/reference/enum/staffsort
 */
export const StaffSortMappings: readonly StaffSort[] = [
    "ID",
    "ID_DESC",
    "ROLE",
    "ROLE_DESC",
    "SEARCH_MATCH",
    "FAVOURITES",
    "FAVOURITES_DESC",
    "RELEVANCE",
];

/**
 * `StudioSort` is a type that represents the sorting options for the `Studio` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'NAME', 'NAME_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC'.
 * @see https://docs.anilist.co/reference/enum/studiosort
 */
export type StudioSort =
    "ID" | "ID_DESC" | "NAME" | "NAME_DESC" | "SEARCH_MATCH" | "FAVOURITES" | "FAVOURITES_DESC";

/**
 * `StudioSortMappings` is a mapping of `StudioSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'NAME', 'NAME_DESC', 'SEARCH_MATCH', 'FAVOURITES', 'FAVOURITES_DESC'.
 * @see https://docs.anilist.co/reference/enum/studiosort
 */
export const StudioSortMappings: readonly StudioSort[] = [
    "ID",
    "ID_DESC",
    "NAME",
    "NAME_DESC",
    "SEARCH_MATCH",
    "FAVOURITES",
    "FAVOURITES_DESC",
];

/**
 * `ThreadSort` is a type that represents the sorting options for the `Thread` query.
 * It can be one of the following: 'ID', 'ID_DESC', 'TITLE', 'TITLE_DESC', 'CREATED_AT', 'CREATED_AT_DESC', 'UPDATED_AT', 'UPDATED_AT_DESC', 'REPLIED_AT', 'REPLIED_AT_DESC', 'REPLY_COUNT', 'REPLY_COUNT_DESC', 'VIEW_COUNT', 'VIEW_COUNT_DESC', 'IS_STICKY', 'SEARCH_MATCH'.
 * @see https://docs.anilist.co/reference/enum/threadsort
 */
export type ThreadSort =
    | "ID"
    | "ID_DESC"
    | "TITLE"
    | "TITLE_DESC"
    | "CREATED_AT"
    | "CREATED_AT_DESC"
    | "UPDATED_AT"
    | "UPDATED_AT_DESC"
    | "REPLIED_AT"
    | "REPLIED_AT_DESC"
    | "REPLY_COUNT"
    | "REPLY_COUNT_DESC"
    | "VIEW_COUNT"
    | "VIEW_COUNT_DESC"
    | "IS_STICKY"
    | "SEARCH_MATCH";

/**
 * `ThreadSortMappings` is a mapping of `ThreadSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC', 'TITLE', 'TITLE_DESC', 'CREATED_AT', 'CREATED_AT_DESC', 'UPDATED_AT', 'UPDATED_AT_DESC', 'REPLIED_AT', 'REPLIED_AT_DESC', 'REPLY_COUNT', 'REPLY_COUNT_DESC', 'VIEW_COUNT', 'VIEW_COUNT_DESC', 'IS_STICKY', 'SEARCH_MATCH'.
 * @see https://docs.anilist.co/reference/enum/threadsort
 */
export const ThreadSortMappings: readonly ThreadSort[] = [
    "ID",
    "ID_DESC",
    "TITLE",
    "TITLE_DESC",
    "CREATED_AT",
    "CREATED_AT_DESC",
    "UPDATED_AT",
    "UPDATED_AT_DESC",
    "REPLIED_AT",
    "REPLIED_AT_DESC",
    "REPLY_COUNT",
    "REPLY_COUNT_DESC",
    "VIEW_COUNT",
    "VIEW_COUNT_DESC",
    "IS_STICKY",
    "SEARCH_MATCH",
];

/**
 * `ThreadCommentSort` is a type that represents the sorting options for the `ThreadComment` query.
 * It can be one of the following: 'ID', 'ID_DESC'.
 * @see https://docs.anilist.co/reference/enum/threadcommentsort
 */
export type ThreadCommentSort = "ID" | "ID_DESC";

/**
 * `ThreadCommentSortMappings` is a mapping of `ThreadCommentSort` enum values to their corresponding string values.
 * It can be one of the following: 'ID', 'ID_DESC'.
 * @see https://docs.anilist.co/reference/enum/threadcommentsort
 */
export const ThreadCommentSortMappings: readonly ThreadCommentSort[] = ["ID", "ID_DESC"];
