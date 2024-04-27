export interface Tag {
  id: number
  name: string
  description: string
  category: string
  rank: number
  isGeneralSpoiler: boolean
  isMediaSpoiler: boolean
  isAdult: boolean
}

export const TagSchema = `
  id
  name
  description
  rank
  isGeneralSpoiler
  isMediaSpoiler
  isAdult
`
