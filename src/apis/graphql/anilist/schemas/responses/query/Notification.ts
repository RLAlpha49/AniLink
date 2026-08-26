import { ActivityNotificationSchema } from "../../Activity";
import { BasicCommentSchema, BasicThreadSchema, BasicUserSchema } from "../../Basic";
import { ThreadNotificationSchema } from "../../Notification";
import { TitleSchema } from "../../Title";

/**
 * `NotificationSchema` is a constant representing the GraphQL schema for a notification query.
 * It includes various types of notifications such as AiringNotification, FollowingNotification, ActivityMessageNotification, ActivityMentionNotification, ActivityReplyNotification, ActivityReplySubscribedNotification, ActivityLikeNotification, ActivityReplyLikeNotification, ThreadCommentMentionNotification, ThreadCommentReplyNotification, ThreadCommentSubscribedNotification, ThreadCommentLikeNotification, ThreadLikeNotification, RelatedMediaAdditionNotification, MediaDataChangeNotification, MediaMergeNotification, and MediaDeletionNotification.
 * @see https://docs.anilist.co/reference/union/notificationunion
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
`;
