import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { APIWrapper } from '../../../base/APIWrapper'
import { type ReviewResponse, ReviewSchema } from '../interfaces/responses/query/Review'

/**
 * `SaveReviewVariables` is an interface that contains the variables that are required to save a review.
 * It includes the review ID, media ID, body, summary, score, and private status.
 */
export interface SaveReviewVariables {
  /**
   * `id` is the ID of the review.
   */
  id: number

  /**
   * `mediaId` is the ID of the media.
   */
  mediaId: number

  /**
   * `body` is the body of the review.
   */
  body: string

  /**
   * `summary` is the summary of the review.
   */
  summary: string

  /**
   * `score` is the score of the review.
   */
  score: number

  /**
   * `private` is a boolean that determines if the review is private.
   */
  private: boolean

  /**
   * `asHtml` is a boolean that determines if the review is in HTML format.
   */
  asHtml?: boolean
}

/**
 * `SaveReviewMutation` is a class representing a mutation to save a review.
 * It includes a method to save a review.
 */
export class SaveReviewMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `SaveReviewMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `saveReview` is a method that sends a mutation request to save a review.
   *
   * @param variables - An object of type `SaveReviewVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   */
  async saveReview (variables: SaveReviewVariables): Promise<ReviewResponse> {
    if (!this.authToken) {
      throw new Error('SaveReviewMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id && !variables.mediaId) {
      throw new Error('id or mediaId variable is required')
    }
    const variableTypeMappings = {
      id: 'number',
      mediaId: 'number',
      body: 'string',
      summary: 'string',
      score: 'number',
      private: 'boolean',
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int, $mediaId: Int, $body: String, $summary: String, $score: Int, $private: Boolean, $asHtml: Boolean) {
        SaveReview(id: $id, mediaId: $mediaId, body: $body, summary: $summary, score: $score, private: $private) {
          ${ReviewSchema}
        }
      }
    `
    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
