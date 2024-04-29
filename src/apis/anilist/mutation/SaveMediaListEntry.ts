import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { FuzzyDateInput, FuzzyDateSchema } from '../interfaces/FuzzyDate'
import { MediaListStatus } from '../types/MediaListStatus'

export interface SaveMediaListEntryVariables {
  id?: number
  mediaId: number
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
  customLists?: string[]
  advancedScores?: number[]
  startedAt?: FuzzyDateInput
  completedAt?: FuzzyDateInput
}

export class SaveMediaListEntryMutation extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async saveMediaListEntry (variables: SaveMediaListEntryVariables): Promise<any> {
    const mutation = `
      mutation ($id: Int, $mediaId: Int, $status: MediaListStatus, $score: Float, $scoreRaw: Int, $progress: Int, $progressVolumes: Int, $repeat: Int, $priority: Int, $private: Boolean, $notes: String, $hiddenFromStatusLists: Boolean, $customLists: [String], $advancedScores: [Float], $startedAt: FuzzyDateInput, $completedAt: FuzzyDateInput) {
        SaveMediaListEntry(id: $id, mediaId: $mediaId, status: $status, score: $score, scoreRaw: $scoreRaw, progress: $progress, progressVolumes: $progressVolumes, repeat: $repeat, priority: $priority, private: $private, notes: $notes, hiddenFromStatusLists: $hiddenFromStatusLists, customLists: $customLists, advancedScores: $advancedScores, startedAt: $startedAt, completedAt: $completedAt) {
          id
          mediaId
          status
          score
          progress
          progressVolumes
          repeat
          priority
          private
          notes
          hiddenFromStatusLists
          customLists
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
