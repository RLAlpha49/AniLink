import { UserResponse } from './User'

/**
 * `AniChartUserResponse` is an interface representing the response from an AniChart user query.
 * It includes the user response, settings, and highlights.
 */
export interface AniChartUserResponse {
  user: UserResponse
  settings: string
  highlights: string
}
