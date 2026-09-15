/**
 * {@link NameSchema} is the shared name selection (`first`/`last`/`full`/`native`) used for
 * the `name` field of characters, staff, and their nested entities. AniList types the
 * field per entity (`CharacterName`, `StaffName`); the selected keys are the same.
 * @see https://docs.anilist.co/reference/object/charactername
 * @see https://docs.anilist.co/reference/object/staffname
 */
export const NameSchema = `
  name {
    first
    last
    full
    native
  }
`;
