import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type ThreadResponse, ThreadSchema } from '../interfaces/responses/query/Thread'
import { type ThreadSort, ThreadSortMappings } from '../types/Sort'
import { validateVariables } from '../../../base/ValidateVariables'

/**
 * `ThreadVariables` is an interface representing the variables for the `ThreadQuery`.
 * It includes optional parameters for querying thread data.
 */
export interface ThreadVariables {
  /**
   * `id` is a number representing the id of the thread.
   */
  id?: number

  /**
   * `userId` is a number representing the id of the user.
   */
  userId?: number

  /**
   * `replyUserId` is a number representing the id of the user who replied.
   */
  replyUserId?: number

  /**
   * `subscribed` is a boolean indicating whether the user is subscribed to the thread.
   */
  subscribed?: boolean

  /**
   * `categoryId` is a number representing the id of the category.
   */
  categoryId?: number

  /**
   * `mediaCategoryId` is a number representing the id of the media category.
   */
  mediaCategoryId?: number

  /**
   * `search` is a string representing the search term.
   */
  search?: string

  /**
   * `id_in` is an array of numbers representing the ids to include in the search.
   */
  id_in?: number[]

  /**
   * `sort` is an array of strings representing the sort order of the thread.
   */
  sort?: ThreadSort[]

  /**
   * `asHtml` is a boolean indicating whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `ThreadQuery` is a class representing a query for thread data.
 * It includes a method to send the thread query and receive the response.
 */
export class ThreadQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ThreadQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `thread` is a method that sends a query request to get thread data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async thread (variables: ThreadVariables): Promise<ThreadResponse> {
    if (!variables) {
      throw new Error('At least one variable must be provided')
    }
    const variableTypeMappings = {
      id: 'number',
      userId: 'number',
      replyUserId: 'number',
      subscribed: 'boolean',
      categoryId: 'number',
      mediaCategoryId: 'number',
      search: 'string',
      id_in: 'number[]',
      sort: ThreadSortMappings,
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($id: Int, $userId: Int, $replyUserId: Int, $subscribed: Boolean, $categoryId: Int, $mediaCategoryId: Int, $search: String, $id_in: [Int], $sort: [ThreadSort], $asHtml: Boolean) {
        Thread (id: $id, userId: $userId, replyUserId: $replyUserId, subscribed: $subscribed, categoryId: $categoryId, mediaCategoryId: $mediaCategoryId, search: $search, id_in: $id_in, sort: $sort) {
          ${ThreadSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
