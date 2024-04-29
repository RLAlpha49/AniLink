/**
 * `NotificationOptionInput` is an interface representing the options for a notification.
 * It includes the type and enabled status each having their own properties.
 */
export interface NotificationOptionInput {
  /**
   * `type` is a string representing the type of the notification.
   */
  type: string

  /**
   * `enabled` is a boolean representing whether the notification is enabled or not.
   */
  enabled: boolean
}
