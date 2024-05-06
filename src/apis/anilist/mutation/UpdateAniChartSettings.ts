import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { APIWrapper } from '../../../base/APIWrapper'

/**
 * `UpdateAniChartSettingsVariables` is an interface that contains the variables that are required to update the AniChart settings.
 */
export interface UpdateAniChartSettingsVariables {
  /**
   * `titleLanguage` is a string representing the language of the title.
   */
  titleLanguage: string

  /**
   * `outgoingLinkProvider` is a string representing the outgoing link provider.
   */
  outgoingLinkProvider: string

  /**
   * `theme` is a string representing the theme of the AniChart.
   */
  theme: string

  /**
   * `sort` is a string representing the sort order of the AniChart.
   */
  sort: string
}

/**
 * `UpdateAniChartSettingsMutation` is a class that represents a mutation to update the AniChart settings.
 */
export class UpdateAniChartSettingsMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `UpdateAniChartSettingsMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `updateAniChartSettings` is a method that sends a mutation request to update the AniChart settings.
   *
   * @param variables - An object of type `UpdateAniChartSettingsVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   */
  async updateAniChartSettings (variables: UpdateAniChartSettingsVariables): Promise<any> {
    if (!this.authToken) {
      throw new Error('UpdateAniChartSettingsMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    const variableTypeMappings = {
      titleLanguage: 'string',
      outgoingLinkProvider: 'string',
      theme: 'string',
      sort: 'string'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($titleLanguage: String, $outgoingLinkProvider: String, $theme: String, $sort: String) {
        UpdateAniChartSettings (titleLanguage: $titleLanguage, outgoingLinkProvider: $outgoingLinkProvider, theme: $theme, sort: $sort)
      }
    `
    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
