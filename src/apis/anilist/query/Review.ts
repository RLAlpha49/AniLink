import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { ReviewResponse, ReviewSchema } from '../interfaces/responses/query/Review'

export interface ReviewVariables {
  id?: number
  mediaId?: number
  userId?: number
  mediaType?: string
  sort?: string[]
  asHtml?: boolean
}

export class ReviewQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async review (variables?: ReviewVariables): Promise<ReviewResponse> {
    const query = `
      query ($id: Int, $mediaId: Int, $userId: Int, $mediaType: MediaType, $sort: [ReviewSort], $asHtml: Boolean) {
        Review (id: $id, mediaId: $mediaId, userId: $userId, mediaType: $mediaType, sort: $sort) {
          ${ReviewSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
