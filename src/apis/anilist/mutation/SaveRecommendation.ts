import { sendRequest } from '../../../base/RequestHandler'
import { type RecommendationResponse, RecommendationSchema } from '../interfaces/responses/query/Recommendation'
import { APIWrapper } from '../../../base/APIWrapper'
import { type RecommendationRating, RecommendationRatingMappings } from '../types/RecommendationRating'
import { validateVariables } from '../../../base/ValidateVariables'

/**
 * `SaveRecommendationVariables` is an interface that contains the variables that are required to save a recommendation.
 * It includes the media ID, media recommendation ID, and rating.
 */
export interface SaveRecommendationVariables {
  /**
   * `mediaId` is the ID of the media.
   */
  mediaId: number

  /**
   * `mediaRecommendationId` is the ID of the media recommendation.
   */
  mediaRecommendationId: number

  /**
   * `rating` is the rating of the recommendation.
   */
  rating: RecommendationRating

  /**
   * `asHtml` is a boolean that determines if the review is in HTML format.
   */
  asHtml?: boolean
}

/**
 * `SaveRecommendationMutation` is a class representing a mutation to save a recommendation.
 * It includes a method to save a recommendation.
 */
export class SaveRecommendationMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `SaveRecommendationMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `saveReview` is a method that sends a mutation request to save a recommendation.
   *
   * @param variables - An object of type `SaveRecommendationVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   */
  async saveRecommendation (variables: SaveRecommendationVariables): Promise<RecommendationResponse> {
    if (!this.authToken) {
      throw new Error('SaveReviewMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.mediaId || !variables.mediaRecommendationId || !variables.rating) {
      throw new Error('mediaId, mediaRecommendationId, and rating variables are required.')
    }
    const variableTypeMappings = {
      mediaId: 'number',
      mediaRecommendationId: 'number',
      rating: RecommendationRatingMappings,
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($mediaId: Int, $mediaRecommendationId: Int, $rating: RecommendationRating, $asHtml: Boolean) {
        SaveRecommendation(mediaId: $mediaId, mediaRecommendationId: $mediaRecommendationId, rating: $rating) {
          ${RecommendationSchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
