/**
 * {@link BasicUserSchema} is a string representing the GraphQL schema for a basic user.
 * It includes the id, name, and avatar with a large size.
 * @see https://docs.anilist.co/reference/object/user
 */
export const BasicUserSchema = `
  id
  name
  avatar {
    large
  }
`;

/**
 * {@link BasicThreadSchema} is a string representing the GraphQL schema for a basic thread.
 * It includes the id, title, body, and site url.
 * @see https://docs.anilist.co/reference/object/thread
 */
export const BasicThreadSchema = `
  id
  title
  body (asHtml: $asHtml)
  siteUrl
`;

/**
 * {@link BasicCommentSchema} is a string representing the GraphQL schema for a basic comment.
 * It includes the id, user id, and thread id.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export const BasicCommentSchema = `
  id
  userId
  threadId
`;
