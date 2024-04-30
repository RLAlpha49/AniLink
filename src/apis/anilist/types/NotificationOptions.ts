/**
 * `NotificationOptions` is a type representing the notification options for a user.
 * It includes a `type` field which is a string representing the type of notification,
 * and an `enabled` field which is a boolean indicating whether the notification is enabled or not.
 */
export interface NotificationOptions {
  /**
   * `type` is a string representing the type of notification.
   */
  type: 'ACTIVITY_MESSAGE' | 'ACTIVITY_REPLY' | 'FOLLOWING' | 'ACTIVITY_MENTION' | 'THREAD_COMMENT_MENTION' | 'THREAD_SUBSCRIBED' | 'THREAD_COMMENT_REPLY' | 'AIRING' | 'ACTIVITY_LIKE' | 'ACTIVITY_REPLY_LIKE' | 'THREAD_LIKE' | 'THREAD_COMMENT_LIKE' | 'ACTIVITY_REPLY_SUBSCRIBED' | 'RELATED_MEDIA_ADDITION' | 'MEDIA_DATA_CHANGE' | 'MEDIA_MERGE' | 'MEDIA_DELETION'

  /**
   * `enabled` is a boolean indicating whether the notification is enabled or not.
   */
  enabled: boolean
}

/**
 * `NotificationOptionsMapping` is a constant that maps the `NotificationOptions` fields to their expected types.
 * The `type` field is mapped to an array of possible values, and the `enabled` field is mapped to 'boolean'.
 */
export const NotificationOptionsMapping = {
  type: [
    'ACTIVITY_MESSAGE',
    'ACTIVITY_REPLY',
    'FOLLOWING',
    'ACTIVITY_MENTION',
    'THREAD_COMMENT_MENTION',
    'THREAD_SUBSCRIBED',
    'THREAD_COMMENT_REPLY',
    'AIRING',
    'ACTIVITY_LIKE',
    'ACTIVITY_REPLY_LIKE',
    'THREAD_LIKE',
    'THREAD_COMMENT_LIKE',
    'ACTIVITY_REPLY_SUBSCRIBED',
    'RELATED_MEDIA_ADDITION',
    'MEDIA_DATA_CHANGE',
    'MEDIA_MERGE',
    'MEDIA_DELETION'
  ],
  enabled: 'boolean'
}
