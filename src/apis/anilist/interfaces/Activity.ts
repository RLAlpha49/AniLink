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
