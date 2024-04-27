export interface Tag {
  id: number
  name: string
  description: string
  category: string
  rank: number
  isGeneralSpoiler: boolean
  isMediaSpoiler: boolean
  isAdult: boolean
  userId: number
}

export const TagSchema = `
  id
  name
  description
  category
  rank
  isGeneralSpoiler
  isMediaSpoiler
  isAdult
  userId
`
