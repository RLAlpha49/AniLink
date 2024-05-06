import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { APIWrapper } from '../../../base/APIWrapper'

/**
 * `UpdateAniChartHighlightsVariables` is an interface that contains the variables that are required to update the AniChart highlights.
 */
export interface UpdateAniChartHighlightsVariables {
  /**
   * `highlights` is an object that contains the media ID and the highlight status.
   */
  highlights: {
    /**
     * `mediaId` is a number representing the media ID.
     */
    mediaId: number

    /**
     * `highlight` is a boolean representing the highlight status.
     */
    highlight: boolean
  }
}

/**
 * `UpdateAniChartHighlightsMutation` is a class that represents a mutation to update the AniChart highlights.
 */
export class UpdateAniChartHighlightsMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `UpdateAniChartHighlightsMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `updateAniChartHighlights` is a method that sends a mutation request to update the AniChart highlights.
   *
   * @param variables - An object of type `UpdateAniChartHighlightsVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   */
  async updateAniChartHighlights (variables: UpdateAniChartHighlightsVariables): Promise<any> {
    if (!this.authToken) {
      throw new Error('UpdateAniChartHighlightsMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    const variableTypeMappings = {
      highlights: {
        mediaId: 'number',
        highlight: 'boolean'
      }
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($highlights: [AniChartHighlightInput]) {
        UpdateAniChartHighlights (highlights: $highlights)
      }
    `
    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
