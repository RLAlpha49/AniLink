/**
 * {@link RankingSchema} is a string representing the GraphQL schema for a ranking.
 * It includes the id, rank, type, format, year, season, all-time status, and context.
 * @see https://docs.anilist.co/reference/object/mediarank
 */
export const RankingSchema = `
  rankings {
    id
    rank
    type
    format
    year
    season
    allTime
    context
  }
`;
