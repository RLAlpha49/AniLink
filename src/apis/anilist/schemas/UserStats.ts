/**
 * `UserAnimeStatsSchema` is a string representing the GraphQL schema for a user's anime statistics.
 * It includes the count, meanScore, minutesWatched, and mediaIds.
 * @see https://docs.anilist.co/reference/object/userstats
 */
export const UserAnimeStatsSchema = `
  count
  meanScore
  minutesWatched
  mediaIds
`;

/**
 * `UserMangaStatsSchema` is a string representing the GraphQL schema for a user's manga statistics.
 * It includes the count, meanScore, chaptersRead, and mediaIds.
 * @see https://docs.anilist.co/reference/object/userstats
 */
export const UserMangaStatsSchema = `
  count
  meanScore
  chaptersRead
  mediaIds
`;
