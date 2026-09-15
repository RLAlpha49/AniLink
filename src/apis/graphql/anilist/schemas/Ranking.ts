/**
 * {@link RankingSchema} is the media-ranking selection: a rank's position, the type of
 * ranking it is, and the scope (format, year, season, all-time) it was computed over.
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
