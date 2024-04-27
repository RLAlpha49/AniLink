import { ActivityHistory } from './ActivityHistory'
import { Distribution } from './Distribution'
import { ScoreDistribution } from './ScoreDistribution'
import { ListScores } from './ListScores'
import { Favoured } from './Favoured'

export interface UserStats {
  watchedTime: number
  chaptersRead: number
  activityHistory: ActivityHistory[]
  animeStatusDistribution: Distribution[]
  mangaStatusDistribution: Distribution[]
  animeScoreDistribution: ScoreDistribution[]
  mangaScoreDistribution: ScoreDistribution[]
  animeListScores: ListScores
  mangaListScores: ListScores
  favouredGenresOverview: Favoured[]
  favouredGenres: Favoured[]
  favouredTags: Favoured[]
  favouredActors: Favoured[]
  favouredStaff: Favoured[]
  favouredStudios: Favoured[]
  favouredYears: Favoured[]
  favouredFormats: Favoured[]
}

export const UserAnimeStatsSchema = `
  count
  meanScore
  minutesWatched
  mediaIds
`

export const UserMangaStatsSchema = `
  count
  meanScore
  chaptersRead
  mediaIds
`
