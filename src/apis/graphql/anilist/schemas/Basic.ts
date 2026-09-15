/**
 * {@link BasicUserSchema} is the minimal user selection: `id`, `name`, and the large
 * avatar. Response fragments interpolate it wherever only the acting user is needed
 * (authors, reply users, notification users).
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
 * {@link BasicThreadSchema} is the minimal thread selection: `id`, `title`, `body`, and
 * `siteUrl`. Notification and comment fragments interpolate it for the thread a payload
 * refers to.
 * @see https://docs.anilist.co/reference/object/thread
 */
export const BasicThreadSchema = `
  id
  title
  body (asHtml: $asHtml)
  siteUrl
`;

/**
 * {@link BasicCommentSchema} is the minimal thread-comment selection: `id`, `userId`, and
 * `threadId`. Notification fragments interpolate it for the comment a payload refers to.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export const BasicCommentSchema = `
  id
  userId
  threadId
`;
