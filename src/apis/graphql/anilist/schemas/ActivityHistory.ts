/**
 * {@link ActivityHistorySchema} is a string representing the GraphQL selection set for a user activity history entry.
 * It includes the date, amount, and level of the activity.
 * @see https://docs.anilist.co/reference/object/useractivityhistory
 */
export const ActivityHistorySchema = `
  date
  amount
  level
`;
