import { TitleSchema } from "./Title";
import { BasicUserSchema } from "./Basic";

/**
 * `ActivityReplySchema` is a constant representing the GraphQL schema for an activity reply query.
 * It includes the id of the reply, the user id, the activity id, the text of the reply, the like count, the like status, the creation date, the user details, and the likes details.
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
 * `ActivitySchema` is a constant representing the GraphQL schema for an activity query.
 * It includes the TextActivity, ListActivity, and MessageActivity each having their own properties.
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
 * `ActivityWithRepliesSchema` is a constant representing the GraphQL schema for an activity query with replies.
 * It includes the TextActivity, ListActivity, and MessageActivity each having their own properties and replies.
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
 * `TextActivity` is an object representing a text activity.
 * It includes the id, user id, type, reply count, text, site url, lock status, subscription status, like count, like status, pin status, creation date, user details, replies, and likes.
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
 * `ListActivitySchema` is an object representing a list activity.
 * It includes the id, user id, type, reply count, status, progress, lock status, subscription status, like count, like status, pin status, site url, creation date, media details, user details, replies, and likes.
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
 * `MessageActivitySchema` is an object representing a message activity.
 * It includes the id, recipient id, messenger id, type, reply count, message, lock status, subscription status, like count, like status, privacy status, site url, creation date, recipient details, messenger details, replies, and likes.
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
 * `ActivityNotificationSchema` is a constant representing the GraphQL schema for an activity notification query.
 * It includes the id of the notification, the user id, the type of the notification, the activity id, the context, the creation date, the activity details, and the user details.
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
 * Union selection set for the V2 activity like payload.
 * @see https://docs.anilist.co/reference/object/activity
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
