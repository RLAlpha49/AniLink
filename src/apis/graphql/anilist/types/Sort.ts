/**
 * {@link MediaSort} is the AniList MediaSort enum: the sort orders the media queries accept.
 * Every key has a `_DESC` counterpart; `SEARCH_MATCH` ranks by relevance to the `search`
 * variable.
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
 * {@link MediaSortMappings} is the allowlist of {@link MediaSort} values accepted by the
 * `sort`/`mediaSort`/`staffMediaSort`/`characterMediaSort` variables of the media, character,
 * staff, and studio queries.
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
 * {@link MediaListSort} is the AniList MediaListSort enum: the sort orders the list queries
 * accept, over both entry fields (`score`, `progress`) and the referenced media's fields
 * (`MEDIA_TITLE_ROMAJI`, `MEDIA_POPULARITY`).
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
 * {@link MediaListSortMappings} is the allowlist of {@link MediaListSort} values accepted by
 * the `sort` variable of the list queries.
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
 * {@link MediaTrendSort} is the AniList MediaTrendSort enum: the sort orders the media-trend
 * queries accept, over the trend snapshot's own fields (date, trending) and the referenced
 * media's fields (score, popularity).
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
 * {@link MediaTrendSortMappings} is the allowlist of {@link MediaTrendSort} values accepted
 * by the `sort` variable of the media-trend queries.
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
 * {@link UserSort} is the AniList UserSort enum: the sort orders the user queries accept.
 * `SEARCH_MATCH` ranks by relevance to the `search` variable.
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
 * {@link UserSortMappings} is the allowlist of {@link UserSort} values accepted by the
 * `sort` variable of the user queries.
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
 * {@link UserStatisticSort} is the AniList UserStatisticsSort enum: the sort orders the
 * per-category statistic rows of a user query accept (the `animeStatSort`/`mangaStatSort`
 * variables).
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
 * {@link UserStatisticSortMappings} is the allowlist of {@link UserStatisticSort} values
 * accepted by the `animeStatSort`/`mangaStatSort` variables of the user queries.
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
 * {@link ActivitySort} is the AniList ActivitySort enum: the sort orders the activity queries
 * accept. `PINNED` surfaces pinned activities first.
 * @see https://docs.anilist.co/reference/enum/activitysort
 */
export type ActivitySort = "ID" | "ID_DESC" | "PINNED";

/**
 * {@link ActivitySortMappings} is the allowlist of {@link ActivitySort} values accepted by
 * the `sort` variable of the activity queries.
 * @see https://docs.anilist.co/reference/enum/activitysort
 */
export const ActivitySortMappings: readonly ActivitySort[] = ["ID", "ID_DESC", "PINNED"];

/**
 * {@link AiringSort} is the AniList AiringSort enum: the sort orders the airing-schedule
 * queries accept. `TIME` orders by airing time, the field the schedule's countdown is
 * driven by.
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
 * {@link AiringSortMappings} is the allowlist of {@link AiringSort} values accepted by the
 * `sort` variable of the airing-schedule queries.
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
 * {@link CharacterSort} is the AniList CharacterSort enum: the sort orders the character
 * queries accept. `SEARCH_MATCH` ranks by relevance to the `search` variable.
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
 * {@link CharacterSortMappings} is the allowlist of {@link CharacterSort} values accepted by
 * the `sort`/`charactersSort` variables of the character, staff, and studio queries.
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
 * {@link RecommendationSort} is the AniList RecommendationSort enum: the sort orders the
 * recommendation queries accept.
 * @see https://docs.anilist.co/reference/enum/recommendationsort
 */
export type RecommendationSort = "ID" | "ID_DESC" | "RATING" | "RATING_DESC";

/**
 * {@link RecommendationSortMappings} is the allowlist of {@link RecommendationSort} values
 * accepted by the `sort` variable of the recommendation queries.
 * @see https://docs.anilist.co/reference/enum/recommendationsort
 */
export const RecommendationSortMappings: readonly RecommendationSort[] = [
    "ID",
    "ID_DESC",
    "RATING",
    "RATING_DESC",
];

/**
 * {@link ReviewSort} is the AniList ReviewSort enum: the sort orders the review queries
 * accept, over the review's own fields (score, rating) and its timestamps.
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
 * {@link ReviewSortMappings} is the allowlist of {@link ReviewSort} values accepted by the
 * `sort` variable of the review queries.
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
 * {@link SiteTrendSort} is the AniList SiteTrendSort enum: the sort orders the per-category
 * trend connections of the site-statistics query accept (its `usersSort`/`animeSort`/…
 * variables).
 * @see https://docs.anilist.co/reference/enum/sitetrendsort
 */
export type SiteTrendSort =
    "DATE" | "DATE_DESC" | "COUNT" | "COUNT_DESC" | "CHANGE" | "CHANGE_DESC";

/**
 * {@link SiteTrendSortMappings} is the allowlist of {@link SiteTrendSort} values accepted by
 * the per-category `sort` variables of the site-statistics query.
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
 * {@link StaffSort} is the AniList StaffSort enum: the sort orders the staff queries accept.
 * `SEARCH_MATCH` ranks by relevance to the `search` variable.
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
 * {@link StaffSortMappings} is the allowlist of {@link StaffSort} values accepted by the
 * `sort` variable of the staff queries.
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
 * {@link StudioSort} is the AniList StudioSort enum: the sort orders the studio queries
 * accept. `SEARCH_MATCH` ranks by relevance to the `search` variable.
 * @see https://docs.anilist.co/reference/enum/studiosort
 */
export type StudioSort =
    "ID" | "ID_DESC" | "NAME" | "NAME_DESC" | "SEARCH_MATCH" | "FAVOURITES" | "FAVOURITES_DESC";

/**
 * {@link StudioSortMappings} is the allowlist of {@link StudioSort} values accepted by the
 * `sort` variable of the studio queries.
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
 * {@link ThreadSort} is the AniList ThreadSort enum: the sort orders the thread queries
 * accept. `IS_STICKY` surfaces pinned threads first; `SEARCH_MATCH` ranks by relevance to
 * the `search` variable.
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
 * {@link ThreadSortMappings} is the allowlist of {@link ThreadSort} values accepted by the
 * `sort` variable of the thread and thread-comment queries.
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
 * {@link ThreadCommentSort} is the AniList ThreadCommentSort enum: the sort orders the
 * thread-comment queries accept. The thread-comment operations currently sort by
 * {@link ThreadSort} values instead; this enum covers the upstream argument type.
 * @see https://docs.anilist.co/reference/enum/threadcommentsort
 */
export type ThreadCommentSort = "ID" | "ID_DESC";

/**
 * {@link ThreadCommentSortMappings} is the allowlist of {@link ThreadCommentSort} values,
 * kept for parity with the upstream enum. The thread-comment operations currently
 * validate their `sort` against {@link ThreadSortMappings} instead.
 * @see https://docs.anilist.co/reference/enum/threadcommentsort
 */
export const ThreadCommentSortMappings: readonly ThreadCommentSort[] = ["ID", "ID_DESC"];
