/**
 * {@link FuzzyDateSchema} is the fuzzy-date selection (`year`/`month`/`day`), interpolated
 * wherever a response carries a partial date such as a birthday or a media start date.
 * Unknown parts come back as `0`.
 * @see https://docs.anilist.co/reference/object/fuzzydate
 */
export const FuzzyDateSchema = `
  year
  month
  day
`;
