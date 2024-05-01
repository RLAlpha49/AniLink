import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { type ThreadCommentResponse, ThreadCommentSchema } from '../../interfaces/responses/query/ThreadComment'
import { ThreadSortMappings } from '../../types/Sort'
import { validateVariables } from '../../../../base/ValidateVariables'

/**
 * `ThreadCommentsVariables` is an interface representing the variables for the `ThreadCommentsQuery`.
 * It includes optional page, per page, id, thread id, user id, sort, and as html.
 */
export interface ThreadCommentsVariables {
  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number

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
   * `sort` is an array of strings representing the sort order.
   */
  sort?: string[]

  /**
   * `asHtml` is a boolean representing whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `ThreadCommentsQuery` is a class representing a query for thread comments.
 * It includes a method to get thread comments.
 */
export class ThreadCommentsQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ThreadCommentsQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `threadComments` is a method that sends a query request to get thread comments.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async threadComments (variables: ThreadCommentsVariables): Promise<ThreadCommentResponse> {
    if (!variables) {
      throw new Error('At least one variable must be provided')
    }
    const variableTypeMappings = {
      page: 'number',
      perPage: 'number',
      id: 'number',
      threadId: 'number',
      userId: 'number',
      sort: ThreadSortMappings,
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($page: Int, $perPage: Int, $id: Int, $threadId: Int, $userId: Int, $sort: [ThreadCommentSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          threadComments (id: $id, threadId: $threadId, userId: $userId, sort: $sort) {
            ${ThreadCommentSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
