import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { ExternalLinkSourceCollectionResponse } from '../interfaces/responses/query/ExternalLinkSourceCollection'

export interface ExternalLinkSourceCollectionVariables {
  id?: number
  type?: string
  mediaType?: string
}

export class ExternalLinkSourceCollectionQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async externalLinkSourceCollection (variables?: ExternalLinkSourceCollectionVariables): Promise<ExternalLinkSourceCollectionResponse> {
    const query = `
      query ($id: Int, $type: ExternalLinkType, $mediaType: ExternalLinkMediaType) {
        ExternalLinkSourceCollection (id: $id, type: $type, mediaType: $mediaType) {
          id
          url
          site
          siteId
          type
          language
          color
          icon
          notes
          isDisabled
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
