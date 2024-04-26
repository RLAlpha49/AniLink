import { Stat } from './Stat'

export interface MediaStatistics {
  count: number
  meanScore: number
  standardDeviation: number
  minutesWatched?: number
  episodesWatched?: number
  chaptersRead?: number
  volumesRead?: number
  formats: Stat[]
  statuses: Stat[]
  scores: Stat[]
  lengths: Stat[]
  releaseYears: Stat[]
  startYears: Stat[]
  genres: Stat[]
  tags: Stat[]
  countries: Stat[]
  voiceActors?: Stat[]
  staff: Stat[]
  studios: Stat[]
}
