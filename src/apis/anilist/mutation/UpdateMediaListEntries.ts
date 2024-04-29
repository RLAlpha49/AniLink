import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { FuzzyDateInput, FuzzyDateSchema } from '../interfaces/FuzzyDate'
import { MediaListStatus } from '../types/MediaListStatus'

export interface UpdateMediaListEntriesVariables {
  status?: MediaListStatus
  score?: number
  scoreRaw?: number
  progress?: number
  progressVolumes?: number
  repeat?: number
  priority?: number
  private?: boolean
  notes?: string
  hiddenFromStatusLists?: boolean
  advancedScores?: number[]
  startedAt?: FuzzyDateInput
  completedAt?: FuzzyDateInput
  ids: number[]
}

export class UpdateMediaListEntriesMutation extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async updateMediaListEntries (variables: UpdateMediaListEntriesVariables): Promise<any> {
    const mutation = `
      mutation ($status: MediaListStatus, $score: Float, $scoreRaw: Int, $progress: Int, $progressVolumes: Int, $repeat: Int, $priority: Int, $private: Boolean, $notes: String, $hiddenFromStatusLists: Boolean, $advancedScores: [Float], $startedAt: FuzzyDateInput, $completedAt: FuzzyDateInput, $ids: [Int]) {
        UpdateMediaListEntries(status: $status, score: $score, scoreRaw: $scoreRaw, progress: $progress, progressVolumes: $progressVolumes, repeat: $repeat, priority: $priority, private: $private, notes: $notes, hiddenFromStatusLists: $hiddenFromStatusLists, advancedScores: $advancedScores, startedAt: $startedAt, completedAt: $completedAt, ids: $ids) {
          id
          status
          score
          progress
          progressVolumes
          repeat
          priority
          private
          notes
          hiddenFromStatusLists
          advancedScores
          startedAt {
            ${FuzzyDateSchema}
          }
          completedAt {
            ${FuzzyDateSchema}
          }
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
