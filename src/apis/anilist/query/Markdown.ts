import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'

/**
 * `MarkdownVariables` is an interface representing the variables for the `MarkdownQuery`.
 * It includes an optional markdown string.
 */
export interface MarkdownVariables {
  /**
   * `markdown` is a string representing the Markdown text to be converted.
   */
  markdown: string
}

/**
 * `MarkdownQuery` is a class representing a query for converting Markdown text to HTML.
 * It includes a method to send the Markdown text and receive the converted HTML.
 */
export class MarkdownQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `MarkdownQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `markdown` is a method that sends a query request to convert Markdown text to HTML.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async markdown (variables: MarkdownVariables): Promise<string> {
    if (!variables.markdown) {
      throw new Error('Markdown variable is required.')
    }
    const variableTypeMapppings = {
      markdown: 'string'
    }

    validateVariables(variables, variableTypeMapppings)

    const query = `
      query ($markdown: String!) {
        Markdown (markdown: $markdown) {
          html
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
