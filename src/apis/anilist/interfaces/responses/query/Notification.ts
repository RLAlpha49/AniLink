import { type Title, TitleSchema } from '../../Title'
import {
  type BasicComment,
  BasicCommentSchema,
  type BasicThread,
  BasicThreadSchema,
  type BasicUser,
  BasicUserSchema
} from '../../Basic'
import { type ActivityNotification, ActivityNotificationSchema } from '../../Activity'
import { type ThreadNotification, ThreadNotificationSchema } from '../../Notification'

/**
 * `NotificationResponse` is an interface representing the response from a notification query.
 * It includes various types of notifications such as AiringNotification, FollowingNotification, ActivityMessageNotification, ActivityMentionNotification, ActivityReplyNotification, ActivityReplySubscribedNotification, ActivityLikeNotification, ActivityReplyLikeNotification, ThreadCommentMentionNotification, ThreadCommentReplyNotification, ThreadCommentSubscribedNotification, ThreadCommentLikeNotification, ThreadLikeNotification, RelatedMediaAdditionNotification, MediaDataChangeNotification, MediaMergeNotification, and MediaDeletionNotification.
 */
export interface NotificationResponse {
  /**
   * `AiringNotification` is an object representing an airing notification.
   * It includes the id, type, animeId, episode, contexts, createdAt, and media of the notification.
   */
  AiringNotification: {
    /**
     * `id` is a number representing the id of the airing notification.
     */
    id: number

    /**
     * `type` is a string representing the type of the airing notification.
     */
    type: string

    /**
     * `animeId` is a number representing the id of the anime associated with the airing notification.
     */
    animeId: number

    /**
     * `episode` is a number representing the episode number of the anime associated with the airing notification.
     */
    episode: number

    /**
     * `contexts` is a string representing the contexts of the airing notification.
     */
    contexts: string

    /**
     * `createdAt` is a number representing the timestamp when the airing notification was created.
     */
    createdAt: number

    /**
     * `media` is an object representing the media associated with the airing notification.
     * It includes the id and title of the media.
     */
    media: {
      /**
       * `id` is a number representing the id of the media.
       */
      id: number

      /**
       * `title` is an instance of `Title` representing the title of the media.
       */
      title: Title
    }
  }

  /**
   * `FollowingNotification` is an object representing a following notification.
   * It includes the id, type, userId, context, createdAt, and user of the notification.
   */
  FollowingNotification: {
    /**
     * `id` is a number representing the id of the following notification.
     */
    id: number

    /**
     * `type` is a string representing the type of the following notification.
     */
    type: string

    /**
     * `userId` is a number representing the id of the user associated with the following notification.
     */
    userId: number

    /**
     * `context` is a string representing the context of the following notification.
     */
    context: string

    /**
     * `createdAt` is a number representing the timestamp when the following notification was created.
     */
    createdAt: number

    /**
     * `user` is an instance of `BasicUser` representing the user associated with the following notification.
     */
    user: BasicUser
  }

  /**
   * `ActivityMessageNotification` is an object representing an activity message notification.
   * It includes the id, userId, type, activityId, context, createdAt, message, and user of the notification.
   */
  ActivityMessageNotification: {
    /**
     * `id` is a number representing the id of the activity message notification.
     */
    id: number

    /**
     * `userId` is a number representing the id of the user associated with the activity message notification.
     */
    userId: number

    /**
     * `type` is a string representing the type of the activity message notification.
     */
    type: string

    /**
     * `activityId` is a number representing the id of the activity associated with the activity message notification.
     */
    activityId: number

    /**
     * `context` is a string representing the context of the activity message notification.
     */
    context: string

    /**
     * `createdAt` is a number representing the timestamp when the activity message notification was created.
     */
    createdAt: number

    /**
     * `message` is an object representing the message associated with the activity message notification.
     * It includes the id, recipientId, messengerId, type, replyCount, message, isLocked, isSubscribed, likeCount, isLiked, isPrivate, siteUrl, createdAt, recipient, messenger, replies, and likes of the message.
     */
    message: {
      /**
       * `id` is a number representing the id of the message.
       */
      id: number

      /**
       * `recipientId` is a number representing the id of the recipient of the message.
       */
      recipientId: number

      /**
       * `messengerId` is a number representing the id of the messenger of the message.
       */
      messengerId: number

      /**
       * `type` is a string representing the type of the message.
       */
      type: string

      /**
       * `replyCount` is a number representing the reply count of the message.
       */
      replyCount: number

      /**
       * `message` is a string representing the content of the message.
       */
      message: string

      /**
       * `isLocked` is a boolean indicating whether the message is locked.
       */
      isLocked: boolean

      /**
       * `isSubscribed` is a boolean indicating whether the user is subscribed to the message.
       */
      isSubscribed: boolean

      /**
       * `likeCount` is a number representing the like count of the message.
       */
      likeCount: number

      /**
       * `isLiked` is a boolean indicating whether the message is liked by the user.
       */
      isLiked: boolean

      /**
       * `isPrivate` is a boolean indicating whether the message is private.
       */
      isPrivate: boolean

      /**
       * `siteUrl` is a string representing the URL of the message on the site.
       */
      siteUrl: string

      /**
       * `createdAt` is a number representing the timestamp when the message was created.
       */
      createdAt: number

      /**
       * `recipient` is an instance of `BasicUser` representing the recipient of the message.
       */
      recipient: BasicUser

      /**
       * `messenger` is an instance of `BasicUser` representing the messenger of the message.
       */
      messenger: BasicUser

      /**
       * `replies` is an array of objects representing the replies to the message.
       * Each object includes the id, userId, activityId, text, createdAt, likeCount, isLiked, user, and likes of the reply.
       */
      replies: Array<{
        /**
         * `id` is a number representing the id of the reply.
         */
        id: number

        /**
         * `userId` is a number representing the id of the user who replied.
         */
        userId: number

        /**
         * `activityId` is a number representing the id of the activity associated with the reply.
         */
        activityId: number

        /**
         * `text` is a string representing the content of the reply.
         */
        text: string

        /**
         * `createdAt` is a number representing the timestamp when the reply was created.
         */
        createdAt: number

        /**
         * `likeCount` is a number representing the like count of the reply.
         */
        likeCount: number

        /**
         * `isLiked` is a boolean indicating whether the reply is liked by the user.
         */
        isLiked: boolean

        /**
         * `user` is an instance of `BasicUser` representing the user who replied.
         */
        user: BasicUser

        /**
         * `likes` is an array of instances of `BasicUser` representing the users who liked the reply.
         */
        likes: BasicUser[]
      }>

      /**
       * `likes` is an array of instances of `BasicUser` representing the users who liked the message.
       */
      likes: BasicUser[]
    }

    /**
     * `user` is an instance of `BasicUser` representing the user associated with the activity message notification.
     */
    user: BasicUser
  }

  /**
   * `ActivityMentionNotification` is an instance of `ActivityNotification` representing an activity mention notification.
   */
  ActivityMentionNotification: ActivityNotification

  /**
   * `ActivityReplyNotification` is an instance of `ActivityNotification` representing an activity reply notification.
   */
  ActivityReplyNotification: ActivityNotification

  /**
   * `ActivityReplySubscribedNotification` is an instance of `ActivityNotification` representing an activity reply subscribed notification.
   */
  ActivityReplySubscribedNotification: ActivityNotification

  /**
   * `ActivityLikeNotification` is an instance of `ActivityNotification` representing an activity like notification.
   */
  ActivityLikeNotification: ActivityNotification

  /**
   * `ActivityReplyLikeNotification` is an instance of `ActivityNotification` representing an activity reply like notification.
   */
  ActivityReplyLikeNotification: ActivityNotification

  /**
   * `ThreadCommentMentionNotification` is an instance of `ThreadNotification` representing a thread comment mention notification.
   */
  ThreadCommentMentionNotification: ThreadNotification

  /**
   * `ThreadCommentReplyNotification` is an instance of `ThreadNotification` representing a thread comment reply notification.
   */
  ThreadCommentReplyNotification: ThreadNotification

  /**
   * `ThreadCommentSubscribedNotification` is an instance of `ThreadNotification` representing a thread comment subscribed notification.
   */
  ThreadCommentSubscribedNotification: ThreadNotification

  /**
   * `ThreadCommentLikeNotification` is an instance of `ThreadNotification` representing a thread comment like notification.
   */
  ThreadCommentLikeNotification: ThreadNotification

  /**
   * `ThreadLikeNotification` is an object representing a thread like notification.
   * It includes the id, userId, type, context, createdAt, thread, comment, and user of the notification.
   */
  ThreadLikeNotification: {
    /**
     * `id` is a number representing the id of the thread like notification.
     */
    id: number

    /**
     * `userId` is a number representing the id of the user associated with the thread like notification.
     */
    userId: number

    /**
     * `type` is a string representing the type of the thread like notification.
     */
    type: string

    /**
     * `context` is a string representing the context of the thread like notification.
     */
    context: string

    /**
     * `createdAt` is a number representing the timestamp when the thread like notification was created.
     */
    createdAt: number

    /**
     * `thread` is an instance of `BasicThread` representing the thread associated with the thread like notification.
     */
    thread: BasicThread

    /**
     * `comment` is an instance of `BasicComment` representing the comment associated with the thread like notification.
     */
    comment: BasicComment

    /**
     * `user` is an instance of `BasicUser` representing the user associated with the thread like notification.
     */
    user: BasicUser
  }

  /**
   * `RelatedMediaAdditionNotification` is an object representing a related media addition notification.
   * It includes the id, type, mediaId, context, createdAt, and media of the notification.
   */
  RelatedMediaAdditionNotification: {
    /**
     * `id` is a number representing the id of the related media addition notification.
     */
    id: number

    /**
     * `type` is a string representing the type of the related media addition notification.
     */
    type: string

    /**
     * `mediaId` is a number representing the id of the media associated with the related media addition notification.
     */
    mediaId: number

    /**
     * `context` is a string representing the context of the related media addition notification.
     */
    context: string

    /**
     * `createdAt` is a number representing the timestamp when the related media addition notification was created.
     */
    createdAt: number

    /**
     * `media` is an object representing the media associated with the related media addition notification.
     * It includes the id and title of the media.
     */
    media: {
      /**
       * `id` is a number representing the id of the media.
       */
      id: number

      /**
       * `title` is an instance of `Title` representing the title of the media.
       */
      title: Title
    }
  }

  /**
   * `MediaDataChangeNotification` is an object representing a media data change notification.
   * It includes the id, type, mediaId, context, reason, createdAt, and media of the notification.
   */
  MediaDataChangeNotification: {
    /**
     * `id` is a number representing the id of the media data change notification.
     */
    id: number

    /**
     * `type` is a string representing the type of the media data change notification.
     */
    type: string

    /**
     * `mediaId` is a number representing the id of the media associated with the media data change notification.
     */
    mediaId: number

    /**
     * `context` is a string representing the context of the media data change notification.
     */
    context: string

    /**
     * `reason` is a string representing the reason for the media data change.
     */
    reason: string

    /**
     * `createdAt` is a number representing the timestamp when the media data change notification was created.
     */
    createdAt: number

    /**
     * `media` is an object representing the media associated with the media data change notification.
     * It includes the id and title of the media.
     */
    media: {
      /**
       * `id` is a number representing the id of the media.
       */
      id: number

      /**
       * `title` is an instance of `Title` representing the title of the media.
       */
      title: Title
    }
  }

  /**
   * `MediaMergeNotification` is an object representing a media merge notification.
   * It includes the id, type, mediaId, deletedMediaTitles, context, reason, createdAt, and media of the notification.
   */
  MediaMergeNotification: {
    /**
     * `id` is a number representing the id of the media merge notification.
     */
    id: number

    /**
     * `type` is a string representing the type of the media merge notification.
     */
    type: string

    /**
     * `mediaId` is a number representing the id of the media associated with the media merge notification.
     */
    mediaId: number

    /**
     * `deletedMediaTitles` is a string representing the titles of the deleted media in the media merge notification.
     */
    deletedMediaTitles: string

    /**
     * `context` is a string representing the context of the media merge notification.
     */
    context: string

    /**
     * `reason` is a string representing the reason for the media merge.
     */
    reason: string

    /**
     * `createdAt` is a number representing the timestamp when the media merge notification was created.
     */
    createdAt: number

    /**
     * `media` is an object representing the media associated with the media merge notification.
     * It includes the id and title of the media.
     */
    media: {
      /**
       * `id` is a number representing the id of the media.
       */
      id: number

      /**
       * `title` is an instance of `Title` representing the title of the media.
       */
      title: Title
    }
  }

  /**
   * `MediaDeletionNotification` is an object representing a media deletion notification.
   * It includes the id, type, deletedMediaTitle, context, reason, and createdAt of the notification.
   */
  MediaDeletionNotification: {
    /**
     * `id` is a number representing the id of the media deletion notification.
     */
    id: number

    /**
     * `type` is a string representing the type of the media deletion notification.
     */
    type: string

    /**
     * `deletedMediaTitle` is a string representing the title of the deleted media in the media deletion notification.
     */
    deletedMediaTitle: string

    /**
     * `context` is a string representing the context of the media deletion notification.
     */
    context: string

    /**
     * `reason` is a string representing the reason for the media deletion.
     */
    reason: string

    /**
     * `createdAt` is a number representing the timestamp when the media deletion notification was created.
     */
    createdAt: number
  }
}

/**
 * `NotificationSchema` is a constant representing the GraphQL schema for a notification query.
 * It includes various types of notifications such as AiringNotification, FollowingNotification, ActivityMessageNotification, ActivityMentionNotification, ActivityReplyNotification, ActivityReplySubscribedNotification, ActivityLikeNotification, ActivityReplyLikeNotification, ThreadCommentMentionNotification, ThreadCommentReplyNotification, ThreadCommentSubscribedNotification, ThreadCommentLikeNotification, ThreadLikeNotification, RelatedMediaAdditionNotification, MediaDataChangeNotification, MediaMergeNotification, and MediaDeletionNotification.
 */
export const NotificationSchema = `
  ... on AiringNotification {
    id
    type
    animeId
    episode
    contexts
    createdAt
    media {
      id
      ${TitleSchema}
    }
  }
  ... on FollowingNotification {
    id
    type
    userId
    context
    createdAt
    user {
      ${BasicUserSchema}
    }
  }
  ... on ActivityMessageNotification {
    id
    userId
    type
    activityId
    context
    createdAt
    message {
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
      replies {
        id
        userId
        activityId
        text (asHtml: $asHtml)
        createdAt
        likeCount
        isLiked
        user {
          ${BasicUserSchema}
        }
        likes {
          ${BasicUserSchema}
        }
      }
      likes {
        ${BasicUserSchema}
      }
    }
    user {
      ${BasicUserSchema}
    }
  }
  ... on ActivityMentionNotification {
    ${ActivityNotificationSchema}
  }
  ... on ActivityReplyNotification {
    ${ActivityNotificationSchema}
  }
  ... on ActivityReplySubscribedNotification {
    ${ActivityNotificationSchema}
  }
  ... on ActivityLikeNotification {
    ${ActivityNotificationSchema}
  }
  ... on ActivityReplyLikeNotification {
    ${ActivityNotificationSchema}
  }
  ... on ThreadCommentMentionNotification {
    ${ThreadNotificationSchema}
  }
  ... on ThreadCommentReplyNotification {
    ${ThreadNotificationSchema}
  }
  ... on ThreadCommentSubscribedNotification {
    ${ThreadNotificationSchema}
  }
  ... on ThreadCommentLikeNotification {
    ${ThreadNotificationSchema}
  }
  ... on ThreadLikeNotification {
    id
    userId
    type
    context
    createdAt
    thread {
      ${BasicThreadSchema}
    }
    comment {
      ${BasicCommentSchema}
    }
    user {
      ${BasicUserSchema}
    }
  }
  ... on RelatedMediaAdditionNotification {
    id
    type
    mediaId
    context
    createdAt
    media {
      id
      ${TitleSchema}
    }
  }
  ... on MediaDataChangeNotification {
    id
    type
    mediaId
    context
    reason
    createdAt
    media {
      id
      ${TitleSchema}
    }
  }
  ... on MediaMergeNotification {
    id
    type
    mediaId
    deletedMediaTitles
    context
    reason
    createdAt
    media {
      id
      ${TitleSchema}
    }
  }
  ... on MediaDeletionNotification {
    id
    type
    deletedMediaTitle
    context
    reason
    createdAt
  }
`
