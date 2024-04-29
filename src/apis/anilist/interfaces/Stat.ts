import { Tag } from './Tag'
import { Staff } from './Staff'
import { Studio } from './Studio'

/**
 * `Stat` is an interface representing the statistics of a media.
 * It includes the count, mean score, minutes watched, chapters read, media ids, format, status, score, length, release year, start year, genre, tag, country, voice actor, character ids, staff, and studio each having their own properties.
 */
export interface Stat {
  /**
   * `count` is a number representing the count of the media.
   */
  count: number

  /**
   * `meanScore` is a number representing the mean score of the media.
   */
  meanScore: number

  /**
   * `minutesWatched` is a number representing the minutes watched of the media.
   */
  minutesWatched?: number

  /**
   * `chaptersRead` is a number representing the chapters read of the media.
   */
  chaptersRead?: number

  /**
   * `mediaIds` is an array of numbers representing the ids of the media.
   */
  mediaIds: number[]

  /**
   * `format` is a string representing the format of the media.
   */
  format?: string

  /**
   * `status` is a string representing the status of the media.
   */
  status?: string

  /**
   * `score` is a number representing the score of the media.
   */
  score?: number

  /**
   * `length` is a number representing the length of the media.
   */
  length?: number

  /**
   * `releaseYear` is a number representing the release year of the media.
   */
  releaseYear?: number

  /**
   * `startYear` is a number representing the start year of the media.
   */
  startYear?: number

  /**
   * `genre` is a string representing the genre of the media.
   */
  genre?: string

  /**
   * `tag` is an instance of `Tag` representing the tag of the media.
   */
  tag?: Tag

  /**
   * `country` is a string representing the country of the media.
   */
  country?: string

  /**
   * `voiceActor` is an instance of `Staff` representing the voice actor of the media.
   */
  voiceActor?: Staff

  /**
   * `characterIds` is an array of numbers representing the ids of the characters in the media.
   */
  characterIds?: number[]

  /**
   * `staff` is an instance of `Staff` representing the staff of the media.
   */
  staff?: Staff

  /**
   * `studio` is an instance of `Studio` representing the studio of the media.
   */
  studio?: Studio
}
