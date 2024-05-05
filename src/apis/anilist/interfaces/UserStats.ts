import { type Distribution, type ScoreDistribution } from './Distribution'
import { type ListScores } from './ListScores'
import { type Favoured } from './Favoured'
import { type ActivityHistory } from './Activity'

/**
 * `UserStats` is an interface representing a user's statistics.
 * It includes the watchedTime, chaptersRead, activityHistory, animeStatusDistribution, mangaStatusDistribution, animeScoreDistribution, mangaScoreDistribution, animeListScores, mangaListScores, favouredGenresOverview, favouredGenres, favouredTags, favouredActors, favouredStaff, favouredStudios, favouredYears, and favouredFormats each having their own properties.
 */
export interface UserStats {
  /**
   * `watchedTime` is a number representing the total time watched by the user.
   */
  watchedTime: number

  /**
   * `chaptersRead` is a number representing the total chapters read by the user.
   */
  chaptersRead: number

  /**
   * `activityHistory` is an array of `ActivityHistory` representing the user's activity history.
   */
  activityHistory: ActivityHistory[]

  /**
   * `animeStatusDistribution` is an array of `Distribution` representing the distribution of the user's anime status.
   */
  animeStatusDistribution: Distribution[]

  /**
   * `mangaStatusDistribution` is an array of `Distribution` representing the distribution of the user's manga status.
   */
  mangaStatusDistribution: Distribution[]

  /**
   * `animeScoreDistribution` is an array of `ScoreDistribution` representing the distribution of the user's anime scores.
   */
  animeScoreDistribution: ScoreDistribution[]

  /**
   * `mangaScoreDistribution` is an array of `ScoreDistribution` representing the distribution of the user's manga scores.
   */
  mangaScoreDistribution: ScoreDistribution[]

  /**
   * `animeListScores` is an instance of `ListScores` representing the user's anime list scores.
   */
  animeListScores: ListScores

  /**
   * `mangaListScores` is an instance of `ListScores` representing the user's manga list scores.
   */
  mangaListScores: ListScores

  /**
   * `favouredGenresOverview` is an array of `Favoured` representing the user's favoured genres overview.
   */
  favouredGenresOverview: Favoured[]

  /**
   * `favouredGenres` is an array of `Favoured` representing the user's favoured genres.
   */
  favouredGenres: Favoured[]

  /**
   * `favouredTags` is an array of `Favoured` representing the user's favoured tags.
   */
  favouredTags: Favoured[]

  /**
   * `favouredActors` is an array of `Favoured` representing the user's favoured actors.
   */
  favouredActors: Favoured[]

  /**
   * `favouredStaff` is an array of `Favoured` representing the user's favoured staff.
   */
  favouredStaff: Favoured[]

  /**
   * `favouredStudios` is an array of `Favoured` representing the user's favoured studios.
   */
  favouredStudios: Favoured[]

  /**
   * `favouredYears` is an array of `Favoured` representing the user's favoured years.
   */
  favouredYears: Favoured[]

  /**
   * `favouredFormats` is an array of `Favoured` representing the user's favoured formats.
   */
  favouredFormats: Favoured[]
}

/**
 * `UserAnimeStatsSchema` is a string representing the GraphQL schema for a user's anime statistics.
 * It includes the count, meanScore, minutesWatched, and mediaIds.
 */
export const UserAnimeStatsSchema = `
  count
  meanScore
  minutesWatched
  mediaIds
`

/**
 * `UserMangaStatsSchema` is a string representing the GraphQL schema for a user's manga statistics.
 * It includes the count, meanScore, chaptersRead, and mediaIds.
 */
export const UserMangaStatsSchema = `
  count
  meanScore
  chaptersRead
  mediaIds
`
