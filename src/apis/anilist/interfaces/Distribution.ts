/**
 * `Distribution` is an interface representing a distribution.
 * It includes the status and amount each having their own properties.
 */
export interface Distribution {
  /**
   * `status` is a string representing the status of the distribution.
   */
  status: string

  /**
   * `amount` is a number representing the amount of the distribution.
   */
  amount: number
}
