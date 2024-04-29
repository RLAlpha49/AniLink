import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { MediaTagCollectionResponse } from '../interfaces/responses/query/MediaTagCollection'
import { TagSchema } from '../interfaces/Tag'

interface MediaTagCollectionVariables {
  status?: number
}

export class MediaTagCollectionQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async mediaTagCollection (variables?: MediaTagCollectionVariables): Promise<MediaTagCollectionResponse> {
    const query = `
      query ($status: Int) {
        MediaTagCollection (status: $status) {
          ${TagSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
