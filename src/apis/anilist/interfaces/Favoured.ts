import { type Tag } from './Tag'
import { type Staff } from './Staff'
import { type Studio } from './Studio'

/**
 * `Favoured` is an interface representing a favoured entity.
 * It includes the genre, amount, meanScore, timeWatched, tag, staff, studio, year, and format each having their own properties.
 */
export interface Favoured {
  /**
   * `genre` is a string representing the genre of the favoured entity.
   */
  genre?: string

  /**
   * `amount` is a number representing the amount of the favoured entity.
   */
  amount: number

  /**
   * `meanScore` is a number representing the mean score of the favoured entity.
   */
  meanScore: number

  /**
   * `timeWatched` is a number representing the time watched of the favoured entity.
   */
  timeWatched: number

  /**
   * `tag` is an object of type `Tag` representing the tag of the favoured entity.
   */
  tag?: Tag

  /**
   * `staff` is an object of type `Staff` representing the staff of the favoured entity.
   */
  staff?: Staff

  /**
   * `studio` is an object of type `Studio` representing the studio of the favoured entity.
   */
  studio?: Studio

  /**
   * `year` is a number representing the year of the favoured entity.
   */
  year?: number

  /**
   * `format` is a string representing the format of the favoured entity.
   */
  format?: string
}
