import { ScoreFormat } from '../types/ScoreFormat'

export interface MediaListOptionsInput {
  scoreFormat: ScoreFormat
  rowOrder: string
  animeList: any
  mangaList: any
}

export type MediaListStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING'

export interface MediaListEntry {
  id: number
  status: string
}

export const MediaListEntrySchema = `
  mediaListEntry {
    id
    status
  }
`
