import { type BasicUser, BasicUserSchema } from './BasicUser'
import { type ActivityReply, ActivityReplySchema } from './ActivityReply'
import { TitleSchema } from './Title'

/**
 * `Activity` is an interface representing the response from an activity query.
 * It includes the TextActivity, ListActivity, and MessageActivity each having their own properties.
 */
export interface Activity {
  /**
   * `TextActivity` is an object representing a text activity.
   * It includes the id, user id, type, reply count, text, site url, lock status, subscription status, like count, like status, pin status, creation date, user details, replies, and likes.
   */
  TextActivity: {
    /**
     * `id` is a number representing the unique identifier of the text activity.
     */
    id: number

    /**
     * `userId` is a number representing the unique identifier of the user who made the text activity.
     */
    userId: number

    /**
     * `type` is a string representing the type of the text activity.
     */
    type: string

    /**
     * `replyCount` is a number representing the count of replies the text activity has received.
     */
    replyCount: number

    /**
     * `text` is a string representing the text of the text activity.
     */
    text: string

    /**
     * `siteUrl` is a string representing the URL of the site where the text activity is posted.
     */
    siteUrl: string

    /**
     * `isLocked` is a boolean representing whether the text activity is locked or not.
     */
    isLocked: boolean

    /**
     * `isSubscribed` is a boolean representing whether the user is subscribed to the text activity or not.
     */
    isSubscribed: boolean

    /**
     * `likeCount` is a number representing the count of likes the text activity has received.
     */
    likeCount: number

    /**
     * `isLiked` is a boolean representing whether the text activity is liked by the user or not.
     */
    isLiked: boolean

    /**
     * `isPinned` is a boolean representing whether the text activity is pinned or not.
     */
    isPinned: boolean

    /**
     * `createdAt` is a number representing the Unix timestamp when the text activity was created.
     */
    createdAt: number

    /**
     * `user` is an object of type `BasicUser` representing the details of the user who made the text activity.
     */
    user: BasicUser

    /**
     * `replies` is an array of `ActivityReply` objects representing the replies to the text activity.
     */
    replies: ActivityReply[]

    /**
     * `likes` is an array of `BasicUser` objects representing the users who liked the text activity.
     */
    likes: BasicUser[]
  }

  /**
   * `ListActivity` is an object representing a list activity.
   * It includes the id, user id, type, reply count, status, progress, lock status, subscription status, like count, like status, pin status, site url, creation date, media details, user details, replies, and likes.
   */
  ListActivity: {
    /**
     * `id` is a number representing the unique identifier of the list activity.
     */
    id: number

    /**
     * `userId` is a number representing the unique identifier of the user who made the list activity.
     */
    userId: number

    /**
     * `type` is a string representing the type of the list activity.
     */
    type: string

    /**
     * `replyCount` is a number representing the count of replies the list activity has received.
     */
    replyCount: number

    /**
     * `status` is a string representing the status of the list activity.
     */
    status: string

    /**
     * `progress` is a number representing the progress of the list activity.
     */
    progress: number

    /**
     * `isLocked` is a boolean representing whether the list activity is locked or not.
     */
    isLocked: boolean

    /**
     * `isSubscribed` is a boolean representing whether the user is subscribed to the list activity or not.
     */
    isSubscribed: boolean

    /**
     * `likeCount` is a number representing the count of likes the list activity has received.
     */
    likeCount: number

    /**
     * `isLiked` is a boolean representing whether the list activity is liked by the user or not.
     */
    isLiked: boolean

    /**
     * `isPinned` is a boolean representing whether the list activity is pinned or not.
     */
    isPinned: boolean

    /**
     * `siteUrl` is a string representing the URL of the site where the list activity is posted.
     */
    siteUrl: string

    /**
     * `createdAt` is a number representing the Unix timestamp when the list activity was created.
     */
    createdAt: number

    /**
     * `media` is an object representing the media details of the list activity.
     * It includes the id and the title of the media.
     */
    media: {
      /**
       * `id` is a number representing the unique identifier of the media.
       */
      id: number

      /**
       * `title` is an object representing the title of the media.
       * It includes the romaji and english title of the media.
       */
      title: {
        /**
         * `romaji` is a string representing the romaji title of the media.
         */
        romaji: string

        /**
         * `english` is a string representing the english title of the media.
         */
        english: string
      }
    }

    /**
     * `user` is an object of type `BasicUser` representing the details of the user who made the list activity.
     */
    user: BasicUser

    /**
     * `replies` is an array of `ActivityReply` objects representing the replies to the list activity.
     */
    replies: ActivityReply[]

    /**
     * `likes` is an array of `BasicUser` objects representing the users who liked the list activity.
     */
    likes: BasicUser[]
  }

  /**
   * `MessageActivity` is an object representing a message activity.
   * It includes the id, recipient id, messenger id, type, reply count, message, lock status, subscription status, like count, like status, privacy status, site url, creation date, recipient details, messenger details, replies, and likes.
   */
  MessageActivity: {
    /**
     * `id` is a number representing the unique identifier of the message activity.
     */
    id: number

    /**
     * `recipientId` is a number representing the unique identifier of the recipient of the message activity.
     */
    recipientId: number

    /**
     * `messengerId` is a number representing the unique identifier of the messenger of the message activity.
     */
    messengerId: number

    /**
     * `type` is a string representing the type of the message activity.
     */
    type: string

    /**
     * `replyCount` is a number representing the count of replies the message activity has received.
     */
    replyCount: number

    /**
     * `message` is a string representing the message of the message activity.
     */
    message: string

    /**
     * `isLocked` is a boolean representing whether the message activity is locked or not.
     */
    isLocked: boolean

    /**
     * `isSubscribed` is a boolean representing whether the user is subscribed to the message activity or not.
     */
    isSubscribed: boolean

    /**
     * `likeCount` is a number representing the count of likes the message activity has received.
     */
    likeCount: number

    /**
     * `isLiked` is a boolean representing whether the message activity is liked by the user or not.
     */
    isLiked: boolean

    /**
     * `isPrivate` is a boolean representing whether the message activity is private or not.
     */
    isPrivate: boolean

    /**
     * `siteUrl` is a string representing the URL of the site where the message activity is posted.
     */
    siteUrl: string

    /**
     * `createdAt` is a number representing the Unix timestamp when the message activity was created.
     */
    createdAt: number

    /**
     * `recipient` is an object of type `BasicUser` representing the details of the recipient of the message activity.
     */
    recipient: BasicUser

    /**
     * `messenger` is an object of type `BasicUser` representing the details of the messenger of the message activity.
     */
    messenger: BasicUser

    /**
     * `replies` is an array of `ActivityReply` objects representing the replies to the message activity.
     */
    replies: ActivityReply[]

    /**
     * `likes` is an array of `BasicUser` objects representing the users who liked the message activity.
     */
    likes: BasicUser[]
  }

  /**
   * `ActivityReply` is an object representing an activity reply.
   * It includes the id, user id, activity id, text, like count, like status, creation date, user details, and likes.
   */
  ActivityReply: {
    /**
     * `id` is a number representing the unique identifier of the activity reply.
     */
    id: number

    /**
     * `userId` is a number representing the unique identifier of the user who made the activity reply.
     */
    userId: number

    /**
     * `activityId` is a number representing the unique identifier of the activity the reply is made to.
     */
    activityId: number

    /**
     * `text` is a string representing the text of the activity reply.
     */
    text: string

    /**
     * `likeCount` is a number representing the count of likes the activity reply has received.
     */
    likeCount: number

    /**
     * `isLiked` is a boolean representing whether the activity reply is liked by the user or not.
     */
    isLiked: boolean

    /**
     * `createdAt` is a number representing the Unix timestamp when the activity reply was created.
     */
    createdAt: number

    /**
     * `user` is an object of type `BasicUser` representing the details of the user who made the activity reply.
     */
    user: BasicUser

    /**
     * `likes` is an array of `BasicUser` objects representing the users who liked the activity reply.
     */
    likes: BasicUser[]
  }

  /**
   * `Thread` is an object representing a thread.
   * It includes the id, title, body, user id, reply user id, reply comment id, reply count, view count, lock status, sticky status, subscription status, like count, like status, replied date, creation date, update date, user details, reply user details, likes, site url, categories, media categories.
   */
  Thread: {
    /**
     * `id` is a number representing the unique identifier of the thread.
     */
    id: number

    /**
     * `title` is a string representing the title of the thread.
     */
    title: string

    /**
     * `body` is a string representing the body of the thread.
     */
    body: string

    /**
     * `userId` is a number representing the unique identifier of the user who made the thread.
     */
    userId: number

    /**
     * `replyUserId` is a number representing the unique identifier of the user who replied to the thread.
     */
    replyUserId: number

    /**
     * `replyCommentId` is a number representing the unique identifier of the comment the thread is a reply to.
     */
    replyCommentId: number

    /**
     * `replyCount` is a number representing the count of replies the thread has received.
     */
    replyCount: number

    /**
     * `viewCount` is a number representing the count of views the thread has received.
     */
    viewCount: number

    /**
     * `isLocked` is a boolean representing whether the thread is locked or not.
     */
    isLocked: boolean

    /**
     * `isSticky` is a boolean representing whether the thread is sticky or not.
     */
    isSticky: boolean

    /**
     * `isSubscribed` is a boolean representing whether the user is subscribed to the thread or not.
     */
    isSubscribed: boolean

    /**
     * `likeCount` is a number representing the count of likes the thread has received.
     */
    likeCount: number

    /**
     * `isLiked` is a boolean representing whether the thread is liked by the user or not.
     */
    isLiked: boolean

    /**
     * `repliedAt` is a number representing the Unix timestamp when the thread was replied to.
     */
    repliedAt: number

    /**
     * `createdAt` is a number representing the Unix timestamp when the thread was created.
     */
    createdAt: number

    /**
     * `updatedAt` is a number representing the Unix timestamp when the thread was last updated.
     */
    updatedAt: number

    /**
     * `user` is an object of type `BasicUser` representing the details of the user who made the thread.
     */
    user: BasicUser
  }

  /**
   * `ThreadComment` is an object representing a thread comment.
   * It includes the id, user id, thread id, comment, like count, like status, site url, creation date, update date, thread details, user details, likes, child comments, lock status.
   */
  ThreadComment: {
    /**
     * `id` is a number representing the unique identifier of the thread comment.
     */
    id: number

    /**
     * `userId` is a number representing the unique identifier of the user who made the thread comment.
     */
    userId: number

    /**
     * `threadId` is a number representing the unique identifier of the thread the comment is made to.
     */
    threadId: number

    /**
     * `comment` is a string representing the comment of the thread.
     */
    comment: string

    /**
     * `likeCount` is a number representing the count of likes the thread comment has received.
     */
    likeCount: number

    /**
     * `isLiked` is a boolean representing whether the thread comment is liked by the user or not.
     */
    isLiked: boolean

    /**
     * `siteUrl` is a string representing the URL of the site where the thread comment is posted.
     */
    siteUrl: string

    /**
     * `createdAt` is a number representing the Unix timestamp when the thread comment was created.
     */
    createdAt: number

    /**
     * `updatedAt` is a number representing the Unix timestamp when the thread comment was last updated.
     */
    updatedAt: number

    /**
     * `thread` is an object representing the details of the thread the comment is made to.
     * It includes the id and the title of the thread.
     */
    thread: {
      /**
       * `id` is a number representing the unique identifier of the thread.
       */
      id: number

      /**
       * `title` is a string representing the title of the thread.
       */
      title: string
    }

    /**
     * `user` is an object of type `BasicUser` representing the details of the user who made the thread comment.
     */
    user: BasicUser

    /**
     * `likes` is an array of `BasicUser` objects representing the users who liked the thread comment.
     */
    likes: BasicUser[]

    /**
     * `isLocked` is a boolean representing whether the thread comment is locked or not.
     */
    isLocked: boolean
  }
}

/**
 * `ActivitySchema` is a constant representing the GraphQL schema for an activity query.
 * It includes the TextActivity, ListActivity, and MessageActivity each having their own properties.
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
`

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
`

/**
 * `ActivityWithRepliesSchema` is a constant representing the GraphQL schema for an activity query with replies.
 * It includes the TextActivity, ListActivity, and MessageActivity each having their own properties and replies.
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
`

/**
 * `TextActivity` is an object representing a text activity.
 * It includes the id, user id, type, reply count, text, site url, lock status, subscription status, like count, like status, pin status, creation date, user details, replies, and likes.
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
`

/**
 * `ListActivitySchema` is an object representing a list activity.
 * It includes the id, user id, type, reply count, status, progress, lock status, subscription status, like count, like status, pin status, site url, creation date, media details, user details, replies, and likes.
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
`

/**
 * `MessageActivitySchema` is an object representing a message activity.
 * It includes the id, recipient id, messenger id, type, reply count, message, lock status, subscription status, like count, like status, privacy status, site url, creation date, recipient details, messenger details, replies, and likes.
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
`
