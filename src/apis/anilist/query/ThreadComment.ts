import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type ThreadCommentResponse, ThreadCommentSchema } from '../interfaces/responses/query/ThreadComment'
import {ThreadSort, ThreadSortMappings} from "../types/Sort";
import {validateVariables} from "../../../base/ValidateVariables";

/**
 * `ThreadCommentVariables` is an interface representing the variables for the `ThreadCommentQuery`.
 * It includes optional parameters for querying thread comment data.
 */
export interface ThreadCommentVariables {
  /**
   * `id` is a number representing the id of the thread comment.
   */
  id?: number

  /**
   * `threadId` is a number representing the id of the thread.
   */
  threadId?: number

  /**
   * `userId` is a number representing the id of the user.
   */
  userId?: number

  /**
   * `sort` is an array of strings representing the sort order of the thread comment.
   */
  sort?: ThreadSort[]

  /**
   * `asHtml` is a boolean indicating whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `ThreadCommentQuery` is a class representing a query for thread comment data.
 * It includes a method to send the thread comment query and receive the response.
 */
export class ThreadCommentQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ThreadCommentQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `threadComment` is a method that sends a query request to get thread comment data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async threadComment (variables: ThreadCommentVariables): Promise<ThreadCommentResponse> {
    if (!variables) {
      throw new Error('At least one variable must be provided')
    }
    const variableTypeMappings = {
      id: 'number',
      threadId: 'number',
      userId: 'number',
      sort: ThreadSortMappings,
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($id: Int, $threadId: Int, $userId: Int, $sort: [ThreadCommentSort], $asHtml: Boolean) {
        ThreadComment (id: $id, threadId: $threadId, userId: $userId, sort: $sort) {
          ${ThreadCommentSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
