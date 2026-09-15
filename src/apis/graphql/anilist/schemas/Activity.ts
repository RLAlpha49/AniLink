import { TitleSchema } from "./Title";
import { BasicUserSchema } from "./Basic";

/**
 * {@link ActivityReplySchema} is the activity-reply selection: the reply's text and
 * author, its like state, and the users who liked it. Activity fragments interpolate it
 * under `replies`.
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export const ActivityReplySchema = `
  id
  userId
  activityId
  text (asHtml: $asHtml)
  likeCount
  isLiked
  createdAt
  user {
    ${BasicUserSchema}
  }
  likes {
    ${BasicUserSchema}
  }
`;

/**
 * {@link ActivitySchema} is the inline selection of the ActivityUnion: the shared fields of
 * every activity variant, with the variant-specific fields selected inline. Activity
 * queries and notifications interpolate it for their `activity` payloads.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export const ActivitySchema = `
  activity {
    ... on TextActivity {
      id
      userId
      type
      replyCount
      text (asHtml: $asHtml)
      siteUrl
      isLocked
      isSubscribed
      likeCount
      isLiked
      isPinned
      createdAt
    }
    ... on ListActivity {
      id
      userId
      type
      replyCount
      status
      progress
      isLocked
      isSubscribed
      likeCount
      isLiked
      isPinned
      siteUrl
      createdAt
      media {
        id
        title {
          romaji
          english
        }
      }
    }
    ... on MessageActivity {
      id
      recipientId
      messengerId
      type
      replyCount
      message (asHtml: $asHtml)
      isLocked
      isSubscribed
      likeCount
      isLiked
      isPrivate
      siteUrl
      createdAt
    }
  }
`;

/**
 * {@link ActivityWithRepliesSchema} is the ActivityUnion selection with each variant's
 * `replies` included, used by the activity queries that surface reply threads.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export const ActivityWithRepliesSchema = `
  ... on TextActivity {
    id
    userId
    type
    replyCount
    text (asHtml: $asHtml)
    siteUrl
    isLocked
    isSubscribed
    likeCount
    isLiked
    isPinned
    createdAt
    user {
      ${BasicUserSchema}
    }
    replies {
      ${ActivityReplySchema}
    }
    likes {
      ${BasicUserSchema}
    }
  }
  ... on ListActivity {
    id
    userId
    type
    replyCount
    status
    progress
    isLocked
    isSubscribed
    likeCount
    isLiked
    isPinned
    siteUrl
    createdAt
    media {
      id
      title {
        romaji
        english
      }
    }
    user {
      ${BasicUserSchema}
    }
    replies {
      ${ActivityReplySchema}
    }
    likes {
      ${BasicUserSchema}
    }
  }
  ... on MessageActivity {
    id
    recipientId
    messengerId
    type
    replyCount
    message (asHtml: $asHtml)
    isLocked
    isSubscribed
    likeCount
    isLiked
    isPrivate
    siteUrl
    createdAt
    recipient {
      ${BasicUserSchema}
    }
    messenger {
      ${BasicUserSchema}
    }
    replies {
      ${ActivityReplySchema}
    }
    likes {
      ${BasicUserSchema}
    }
  }
`;

/**
 * {@link TextActivitySchema} is the text-activity selection: a user-written status post,
 * with its author, text, like state, and replies. `SaveTextActivity` sends it.
 * @see https://docs.anilist.co/reference/object/textactivity
 */
export const TextActivitySchema = `
  id
  userId
  type
  replyCount
  text (asHtml: $asHtml)
  siteUrl
  isLocked
  isSubscribed
  likeCount
  isLiked
  isPinned
  createdAt
  user {
    ${BasicUserSchema}
  }
  replies {
    ${ActivityReplySchema}
  }
  likes {
    ${BasicUserSchema}
  }
`;

/**
 * {@link ListActivitySchema} is the list-activity selection: the auto-generated feed entry
 * a list update produces, with the media, the status/progress change, and the acting user.
 * `SaveListActivity` sends it.
 * @see https://docs.anilist.co/reference/object/listactivity
 */
export const ListActivitySchema = `
  id
  userId
  type
  replyCount
  status
  progress
  isLocked
  isSubscribed
  likeCount
  isLiked
  isPinned
  siteUrl
  createdAt
  media {
    id
    title {
      romaji
      english
    }
  }
  user {
    ${BasicUserSchema}
  }
  replies {
    ${ActivityReplySchema}
  }
  likes {
    ${BasicUserSchema}
  }
`;

/**
 * {@link MessageActivitySchema} is the message-activity selection: a private message
 * thread between two users, with both parties and its replies. `SaveMessageActivity`
 * sends it.
 * @see https://docs.anilist.co/reference/object/messageactivity
 */
export const MessageActivitySchema = `
  id
  recipientId
  messengerId
  type
  replyCount
  message (asHtml: $asHtml)
  isLocked
  isSubscribed
  likeCount
  isLiked
  isPrivate
  siteUrl
  createdAt
  recipient {
    ${BasicUserSchema}
  }
  messenger {
    ${BasicUserSchema}
  }
  replies {
    ${ActivityReplySchema}
  }
  likes {
    ${BasicUserSchema}
  }
`;

/**
 * {@link ActivityNotificationSchema} is the activity-notification selection: the shared
 * fields of every activity-variant notification, with the triggering activity and its
 * acting user expanded.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export const ActivityNotificationSchema = `
  id
  userId
  type
  activityId
  context
  createdAt
  ${ActivitySchema}
    user {
      ${BasicUserSchema}
    }
`;

/**
 * Union selection set for the V2 activity-like payload.
 *
 * It covers activity variants and related replies, threads, and thread comments,
 * reusing {@link ActivityReplySchema}, {@link BasicUserSchema}, and {@link TitleSchema} for nested selections.
 *
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export const ActivitySchemaV2 = `
  ... on TextActivity {
    id
    userId
    type
    replyCount
    text (asHtml: $asHtml)
    siteUrl
    isLocked
    isSubscribed
    likeCount
    isLiked
    isPinned
    createdAt
    user {
      ${BasicUserSchema}
    }
    replies {
      ${ActivityReplySchema}
    }
    likes {
      ${BasicUserSchema}
    }
  }
  ... on ListActivity {
    id
    userId
    type
    replyCount
    status
    progress
    isLocked
    isSubscribed
    likeCount
    isLiked
    isPinned
    siteUrl
    createdAt
    media {
      id
      title {
        romaji
        english
      }
    }
    user {
      ${BasicUserSchema}
    }
    replies {
      ${ActivityReplySchema}
    }
    likes {
      ${BasicUserSchema}
    }
  }
  ... on MessageActivity {
    id
    recipientId
    messengerId
    type
    replyCount
    message (asHtml: $asHtml)
    isLocked
    isSubscribed
    likeCount
    isLiked
    isPrivate
    siteUrl
    createdAt
    recipient {
      ${BasicUserSchema}
    }
    messenger {
      ${BasicUserSchema}
    }
    replies {
      ${ActivityReplySchema}
    }
    likes {
      ${BasicUserSchema}
    }
  }
  ... on ActivityReply {
    id
    userId
    activityId
    text (asHtml: $asHtml)
    likeCount
    isLiked
    createdAt
    user {
      ${BasicUserSchema}
    }
    likes {
      ${BasicUserSchema}
    }
  }
  ... on Thread {
    id
    title
    body (asHtml: $asHtml)
    ThreadUserId: userId
    replyUserId
    replyCommentId
    ThreadReplyCount: replyCount
    viewCount
    isLocked
    isSticky
    isSubscribed
    likeCount
    isLiked
    repliedAt
    createdAt
    updatedAt
    user {
      ${BasicUserSchema}
    }
    replyUser {
      ${BasicUserSchema}
    }
    likes {
      ${BasicUserSchema}
    }
    siteUrl
    categories {
      id
      name
    }
    mediaCategories {
      id
      ${TitleSchema}
    }
  }
  ... on ThreadComment {
    id
    userId
    threadId
    comment (asHtml: $asHtml)
    likeCount
    isLiked
    siteUrl
    createdAt
    updatedAt
    thread {
      id
      title
    }
    user {
      ${BasicUserSchema}
    }
    likes {
      ${BasicUserSchema}
    }
    childComments
    isLocked
  }
`;
