import { Title, TitleSchema } from '../../Title'
import { ActivityNotification, ActivityNotificationSchema } from '../../ActivityNotification'
import { BasicUser, BasicUserSchema } from '../../BasicUser'
import { BasicThread, BasicThreadSchema } from '../../BasicThread'
import { BasicComment, BasicCommentSchema } from '../../BasicComment'
import { ThreadNotification, ThreadNotificationSchema } from '../../ThreadNotification'

export interface NotificationResponse {
  AiringNotification: {
    id: number
    type: string
    animeId: number
    episode: number
    contexts: string
    createdAt: number
    media: {
      id: number
      title: Title
    }
  }
  FollowingNotification: {
    id: number
    type: string
    userId: number
    context: string
    createdAt: number
    user: BasicUser
  }
  ActivityMessageNotification: {
    id: number
    userId: number
    type: string
    activityId: number
    context: string
    createdAt: number
    message: {
      id: number
      recipientId: number
      messengerId: number
      type: string
      replyCount: number
      message: string
      isLocked: boolean
      isSubscribed: boolean
      likeCount: number
      isLiked: boolean
      isPrivate: boolean
      siteUrl: string
      createdAt: number
      recipient: BasicUser
      messenger: BasicUser
      replies: Array<{
        id: number
        userId: number
        activityId: number
        text: string
        createdAt: number
        likeCount: number
        isLiked: boolean
        user: BasicUser
        likes: BasicUser[]
      }>
      likes: BasicUser[]
    }
    user: BasicUser
  }
  ActivityMentionNotification: ActivityNotification
  ActivityReplyNotification: ActivityNotification
  ActivityReplySubscribedNotification: ActivityNotification
  ActivityLikeNotification: ActivityNotification
  ActivityReplyLikeNotification: ActivityNotification
  ThreadCommentMentionNotification: ThreadNotification
  ThreadCommentReplyNotification: ThreadNotification
  ThreadCommentSubscribedNotification: ThreadNotification
  ThreadCommentLikeNotification: ThreadNotification
  ThreadLikeNotification: {
    id: number
    userId: number
    type: string
    context: string
    createdAt: number
    thread: BasicThread
    comment: BasicComment
    user: BasicUser
  }
  RelatedMediaAdditionNotification: {
    id: number
    type: string
    mediaId: number
    context: string
    createdAt: number
    media: {
      id: number
      title: Title
    }
  }
  MediaDataChangeNotification: {
    id: number
    type: string
    mediaId: number
    context: string
    reason: string
    createdAt: number
    media: {
      id: number
      title: Title
    }
  }
  MediaMergeNotification: {
    id: number
    type: string
    mediaId: number
    deletedMediaTitles: string
    context: string
    reason: string
    createdAt: number
    media: {
      id: number
      title: Title
    }
  }
  MediaDeletionNotification: {
    id: number
    type: string
    deletedMediaTitle: string
    context: string
    reason: string
    createdAt: number
  }
}

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
