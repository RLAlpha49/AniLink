export interface BasicComment {
  id: number
  userId: number
  threadId: number
}

export const BasicCommentSchema = `
  id
  userId
  threadId
`
