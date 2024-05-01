import { type Stat } from './Stat'

/**
 * `MediaStatistics` is an interface representing the statistics of a media.
 * It includes various properties related to the statistics of the media.
 */
export interface MediaStatistics {
  /**
   * `count` is a number representing the count of the media.
   */
  count: number

  /**
   * `meanScore` is a number representing the mean score of the media.
   */
  meanScore: number

  /**
   * `standardDeviation` is a number representing the standard deviation of the media.
   */
  standardDeviation: number

  /**
   * `minutesWatched` is an optional number representing the minutes watched of the media.
   */
  minutesWatched?: number

  /**
   * `episodesWatched` is an optional number representing the episodes watched of the media.
   */
  episodesWatched?: number

  /**
   * `chaptersRead` is an optional number representing the chapters read of the media.
   */
  chaptersRead?: number

  /**
   * `volumesRead` is an optional number representing the volumes read of the media.
   */
  volumesRead?: number

  /**
   * `formats` is an array of `Stat` objects representing the formats of the media.
   */
  formats: Stat[]

  /**
   * `statuses` is an array of `Stat` objects representing the statuses of the media.
   */
  statuses: Stat[]

  /**
   * `scores` is an array of `Stat` objects representing the scores of the media.
   */
  scores: Stat[]

  /**
   * `lengths` is an array of `Stat` objects representing the lengths of the media.
   */
  lengths: Stat[]

  /**
   * `releaseYears` is an array of `Stat` objects representing the release years of the media.
   */
  releaseYears: Stat[]

  /**
   * `startYears` is an array of `Stat` objects representing the start years of the media.
   */
  startYears: Stat[]

  /**
   * `genres` is an array of `Stat` objects representing the genres of the media.
   */
  genres: Stat[]

  /**
   * `tags` is an array of `Stat` objects representing the tags of the media.
   */
  tags: Stat[]

  /**
   * `countries` is an array of `Stat` objects representing the countries of the media.
   */
  countries: Stat[]

  /**
   * `voiceActors` is an optional array of `Stat` objects representing the voice actors of the media.
   */
  voiceActors?: Stat[]

  /**
   * `staff` is an array of `Stat` objects representing the staff of the media.
   */
  staff: Stat[]

  /**
   * `studios` is an array of `Stat` objects representing the studios of the media.
   */
  studios: Stat[]
}
