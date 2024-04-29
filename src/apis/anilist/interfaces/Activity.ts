import { BasicUser, BasicUserSchema } from './BasicUser'
import { ActivityReply, ActivityReplySchema } from './ActivityReply'

export type ListActivityOptionInput = 'ANIME_LIST' | 'MANGA_LIST'

export interface Activity {
  TextActivity: {
    id: number
    userId: number
    type: string
    replyCount: number
    text: string
    siteUrl: string
    isLocked: boolean
    isSubscribed: boolean
    likeCount: number
    isLiked: boolean
    isPinned: boolean
    createdAt: number
    user: BasicUser
    replies: ActivityReply[]
    likes: BasicUser[]
  }
  ListActivity: {
    id: number
    userId: number
    type: string
    replyCount: number
    status: string
    progress: number
    isLocked: boolean
    isSubscribed: boolean
    likeCount: number
    isLiked: boolean
    isPinned: boolean
    siteUrl: string
    createdAt: number
    media: {
      id: number
      title: {
        romaji: string
        english: string
      }
    }
    user: BasicUser
    replies: ActivityReply[]
    likes: BasicUser[]
  }
  MessageActivity: {
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
    replies: ActivityReply[]
    likes: BasicUser[]
  }
}

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
