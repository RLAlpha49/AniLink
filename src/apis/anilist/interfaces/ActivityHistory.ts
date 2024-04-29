/**
 * `ActivityHistory` is an interface representing the history of an activity.
 * It includes the date of the activity, the amount of the activity, and the level of the activity.
 */
export interface ActivityHistory {
  /**
   * `date` is a number representing the date of the activity.
   * It is expressed as a Unix timestamp.
   */
  date: number

  /**
   * `amount` is a number representing the amount of the activity.
   * The exact meaning of this property depends on the context in which the `ActivityHistory` interface is used.
   */
  amount: number

  /**
   * `level` is a number representing the level of the activity.
   * The exact meaning of this property depends on the context in which the `ActivityHistory` interface is used.
   */
  level: number
}
