import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { APIWrapper } from '../../../base/APIWrapper'

/**
 * `DeleteReviewVariables` is an interface that contains the variables that are required for the `DeleteReview` mutation.
 * It includes the review ID.
 */
export interface DeleteReviewVariables {
  /**
   * `id` is the ID of the review.
   */
  id: number
}

/**
 * `DeleteReviewMutation` is a class representing a mutation to delete a review.
 * It includes a method to delete a review.
 */
export class DeleteReviewMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `DeleteReviewMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `deleteReview` is a method that sends a mutation request to delete a review.
   *
   * @param variables - An object of type `DeleteReviewVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   */
  async deleteReview (variables: DeleteReviewVariables): Promise<any> {
    if (!this.authToken) {
      throw new Error('DeleteReviewMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id) {
      throw new Error('id variable is required')
    }
    const variableTypeMappings = {
      id: 'number'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int) {
        DeleteReview(id: $id) {
          deleted
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
