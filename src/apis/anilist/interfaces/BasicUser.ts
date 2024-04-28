export interface BasicUser {
  id: number
  name: string
  avatar: {
    large: string
  }
}

export const BasicUserSchema = `
  id
  name
  avatar {
    large
  }
`
