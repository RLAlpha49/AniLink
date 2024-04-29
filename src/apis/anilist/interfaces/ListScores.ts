/**
 * `ListScores` is an interface representing the scores of a list.
 * It includes the meanScore and standardDeviation each having their own properties.
 */
export interface ListScores {
  /**
   * `meanScore` is a number representing the mean score of the list.
   */
  meanScore: number

  /**
   * `standardDeviation` is a number representing the standard deviation of the scores in the list.
   */
  standardDeviation: number
}
