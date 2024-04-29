import { UserResponse } from './User'

/**
 * `AniChartUserResponse` is an interface representing the response from an AniChart user query.
 * It includes the user response, settings, and highlights.
 */
export interface AniChartUserResponse {
  /**
   * `user` is an instance of `UserResponse` representing the user's data.
   */
  user: UserResponse

  /**
   * `settings` is a string representing the user's AniChart settings.
   */
  settings: string

  /**
   * `highlights` is a string representing the user's AniChart highlights.
   */
  highlights: string
}
