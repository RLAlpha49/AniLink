import { ScoreDistribution } from './ScoreDistribution'
import { StatusDistribution } from './StatusDistribution'

/**
 * `MediaStats` is an interface representing the statistics of a media.
 * It includes score distribution and status distribution each having their own properties.
 */
export interface MediaStats {
  /**
   * `scoreDistribution` is an array of `ScoreDistribution` objects representing the score distribution of the media.
   */
  scoreDistribution: ScoreDistribution[]

  /**
   * `statusDistribution` is an array of `StatusDistribution` objects representing the status distribution of the media.
   */
  statusDistribution: StatusDistribution[]
}
