import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { type ActivityReply, ActivityReplySchema } from '../../interfaces/ActivityReply'

/**
 * `ActivityRepliesVariables` is an interface representing the variables for the `ActivityRepliesQuery`.
 * It includes optional page, per page, id, activity id, and as html.
 */
export interface ActivityRepliesVariables {
  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number

  /**
   * `id` is a number representing the id of the activity reply.
   */
  id?: number

  /**
   * `activityId` is a number representing the id of the activity.
   */
  activityId?: number

  /**
   * `asHtml` is a boolean representing whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `ActivityRepliesQuery` is a class representing a query for activity replies.
 * It includes a method to get activity replies.
 */
export class ActivityRepliesQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ActivityRepliesQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `activityReplies` is a method that sends a query request to get activity replies.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async activityReplies (variables?: ActivityRepliesVariables): Promise<ActivityReply> {
    const query = `
      query ($page: Int, $perPage: Int, $id: Int, $activityId: Int, $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          activityReplies (id: $id, activityId: $activityId) {
            ${ActivityReplySchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
