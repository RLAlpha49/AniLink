import { MediaStatistics } from './MediaStatistics'

/**
 * `Statistics` is an interface representing the statistics of a media.
 * It includes the anime and manga each being an instance of `MediaStatistics`.
 */
export interface Statistics {
  /**
   * `anime` is an instance of `MediaStatistics` representing the statistics of an anime.
   */
  anime: MediaStatistics

  /**
   * `manga` is an instance of `MediaStatistics` representing the statistics of a manga.
   */
  manga: MediaStatistics
}
