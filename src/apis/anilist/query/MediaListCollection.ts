import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import {
  MediaListCollectionQuerySchema,
  MediaListCollectionResponse
} from '../interfaces/responses/MediaListCollectionResponse'

// import { MediaListCollectionResponse } from '../interfaces/responses/MediaListCollection'

interface MediaListCollectionVariables {
  userId?: number
  userName?: string
  type?: string
  status?: string
  notes?: string
  startedAt?: number
  completedAt?: number
  forceSingleCompletedList?: boolean
  chunk?: number
  perChunk?: number
  status_in?: string[]
  status_not_in?: string[]
  status_not?: string
  notes_like?: string
  startedAt_greater?: number
  startedAt_lesser?: number
  startedAt_like?: string
  completedAt_greater?: number
  completedAt_lesser?: number
  completedAt_like?: string
  sort?: string[]
  scoreFormat?: string
  asArray?: boolean
}

export class MediaListCollectionQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async mediaListCollection (variables?: MediaListCollectionVariables): Promise<MediaListCollectionResponse> {
    const query = MediaListCollectionQuerySchema

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
