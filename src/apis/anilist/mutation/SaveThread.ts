import { type ThreadResponse, ThreadSchema } from '../interfaces/responses/query/Thread'
import { validateVariables } from '../../../base/ValidateVariables'
import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'

/**
 * `SaveThreadVariables` is an interface that contains the variables that are passed to the `SaveThread` mutation.
 * It includes the ID, title, body, categories, mediaCategories, sticky, locked, and asHtml variables.
 */
export interface SaveThreadVariables {
  /**
   * `id` is the ID of the thread.
   */
  id: number

  /**
   * `title` is the title of the thread.
   */
  title: string

  /**
   * `body` is the body of the thread.
   */
  body: string

  /**
   * `categories` is an array of category IDs that the thread belongs to.
   */
  categories: number[]

  /**
   * `mediaCategories` is an array of media category IDs that the thread belongs to.
   */
  mediaCategories: number[]

  /**
   * `sticky` is a boolean that determines if the thread is sticky.
   */
  sticky: boolean

  /**
   * `locked` is a boolean that determines if the thread is locked.
   */
  locked: boolean

  /**
   * `asHtml` is a boolean that determines if the response is in HTML format.
   */
  asHtml: boolean
}

/**
 * `SaveThreadMutation` is a class representing a mutation to save a thread.
 * It includes a method to save a thread
 */
export class SaveThreadMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `SaveThreadMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `SaveThread` is a method that sends a mutation request to save a thread.
   *
   * @param variables - An object of type `SaveThreadVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async saveThread (variables: SaveThreadVariables): Promise<ThreadResponse> {
    if (!this.authToken) {
      throw new Error('SaveThreadMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id && !variables.title) {
      throw new Error('id or title variable is required')
    }
    const variableTypeMappings = {
      id: 'number',
      title: 'string',
      body: 'string',
      categories: 'number[]',
      mediaCategories: 'number[]',
      sticky: 'boolean',
      locked: 'boolean',
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int, $title: String, $body: String, $categories: [Int], $mediaCategories: [Int], $sticky: Boolean, $locked: Boolean, $asHtml: Boolean) {
        SaveThread (id: $id, title: $title, body: $body, categories: $categories, mediaCategories: $mediaCategories, sticky: $sticky, locked: $locked) {
          ${ThreadSchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
