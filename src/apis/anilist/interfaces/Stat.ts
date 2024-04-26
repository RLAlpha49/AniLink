import { Tag } from './Tag'
import { Staff } from './Staff'
import { Studio } from './Studio'

export interface Stat {
  count: number
  meanScore: number
  minutesWatched?: number
  chaptersRead?: number
  mediaIds: number[]
  format?: string
  status?: string
  score?: number
  length?: number
  releaseYear?: number
  startYear?: number
  genre?: string
  tag?: Tag
  country?: string
  voiceActor?: Staff
  characterIds?: number[]
  staff?: Staff
  studio?: Studio
}
