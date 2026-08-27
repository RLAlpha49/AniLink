/**
 * {@link NameSchema} is a string representing the GraphQL schema for a name.
 * It includes the first name, last name, full name, and native name.
 * @see https://docs.anilist.co/reference/object/charactername
 */
export const NameSchema = `
  name {
    first
    last
    full
    native
  }
`;
