/**
 * `Tag` is an interface representing a tag.
 * It includes the id, name, description, category, rank, isGeneralSpoiler, isMediaSpoiler, isAdult, and userId each having their own properties.
 */
export interface Tag {
  /**
   * `id` is a number representing the id of the tag.
   */
  id: number

  /**
   * `name` is a string representing the name of the tag.
   */
  name: string

  /**
   * `description` is a string representing the description of the tag.
   */
  description: string

  /**
   * `category` is a string representing the category of the tag.
   */
  category: string

  /**
   * `rank` is a number representing the rank of the tag.
   */
  rank: number

  /**
   * `isGeneralSpoiler` is a boolean representing whether the tag is a general spoiler.
   */
  isGeneralSpoiler: boolean

  /**
   * `isMediaSpoiler` is a boolean representing whether the tag is a media spoiler.
   */
  isMediaSpoiler: boolean

  /**
   * `isAdult` is a boolean representing whether the tag is adult.
   */
  isAdult: boolean

  /**
   * `userId` is a number representing the id of the user who created the tag.
   */
  userId: number
}

/**
 * `TagSchema` is a string representing the GraphQL schema for a tag.
 * It includes the id, name, description, category, rank, isGeneralSpoiler, isMediaSpoiler, isAdult, and userId.
 */
export const TagSchema = `
  id
  name
  description
  category
  rank
  isGeneralSpoiler
  isMediaSpoiler
  isAdult
  userId
`
