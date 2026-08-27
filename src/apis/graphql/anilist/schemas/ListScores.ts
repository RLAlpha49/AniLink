/**
 * {@link ListScoresSchema} is a string representing the GraphQL selection set for a list score summary.
 * It includes the meanScore and standardDeviation of the list.
 * @see https://docs.anilist.co/reference/object/listscorestats
 */
export const ListScoresSchema = `
  meanScore
  standardDeviation
`;
