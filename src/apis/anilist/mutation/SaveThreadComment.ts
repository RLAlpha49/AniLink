import { validateVariables } from '../../../base/ValidateVariables'
import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type ThreadCommentResponse, ThreadCommentSchema } from '../interfaces/responses/query/ThreadComment'

/**
 * `SaveThreadCommentVariables` is an interface that contains the variables that are passed to the `SaveThreadComment` mutation.
 * It contains the ID of the thread, the ID of the parent comment, the comment to be saved, and a boolean to determine if the response is in HTML format.
 */
export interface SaveThreadCommentVariables {
  /**
   * `id` is the ID of the thread.
   */
  id: number

  /**
   * `threadId` is the ID of the thread.
   */
  threadId: number

  /**
   * `parentCommentId` is the ID of the parent comment.
   */
  parentCommentId: number

  /**
   * `comment` is the comment to be saved.
   */
  comment: string

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
 * `SaveThreadCommentMutation` is a class representing a mutation to save a thread comment.
 * It includes a method to save a thread
 */
export class SaveThreadCommentMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `SaveThreadCommentMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `saveThreadComment` is a method that sends a mutation request to save a thread comment.
   *
   * @param variables - An object of type `SaveThreadCommentVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async saveThreadComment (variables: SaveThreadCommentVariables): Promise<ThreadCommentResponse> {
    if (!this.authToken) {
      throw new Error('SaveThreadCommentMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id && !variables.threadId) {
      throw new Error('id or title variable is required')
    }
    const variableTypeMappings = {
      id: 'number',
      threadId: 'number',
      parentCommentId: 'number',
      comment: 'string',
      locked: 'boolean',
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int, $threadId: Int, $parentCommentId: Int, $comment: String, $locked: Boolean, $asHtml: Boolean) {
        SaveThreadComment (id: $id, threadId: $threadId, parentCommentId: $parentCommentId, comment: $comment, locked: $locked) {
          ${ThreadCommentSchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
