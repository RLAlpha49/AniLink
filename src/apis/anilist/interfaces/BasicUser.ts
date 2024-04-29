/**
 * `BasicUser` is an interface representing a basic user.
 * It includes the id, name, and avatar each having their own properties.
 */
export interface BasicUser {
  /**
   * `id` is a number representing the unique identifier of the user.
   */
  id: number

  /**
   * `name` is a string representing the name of the user.
   */
  name: string

  /**
   * `avatar` is an object representing the avatar of the user.
   * It includes a large size avatar.
   */
  avatar: {
    /**
     * `large` is a string representing the URL of the large size avatar of the user.
     */
    large: string
  }
}

/**
 * `BasicUserSchema` is a string representing the GraphQL schema for a basic user.
 * It includes the id, name, and avatar with a large size.
 */
export const BasicUserSchema = `
  id
  name
  avatar {
    large
  }
`
