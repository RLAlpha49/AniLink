/**
 * {@link ActivityHistorySchema} is the activity-history selection: one day of a user's
 * activity, with the amount done and the level reached.
 * @see https://docs.anilist.co/reference/object/useractivityhistory
 */
export const ActivityHistorySchema = `
  date
  amount
  level
`;
