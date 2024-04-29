import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { FuzzyDateInput, FuzzyDateSchema } from '../interfaces/FuzzyDate'
import { MediaListStatus } from '../types/MediaListStatus'

/**
 * `UpdateMediaListEntriesVariables` is an interface representing the variables for the `UpdateMediaListEntriesMutation`.
 * It includes optional status, score, raw score, progress, progress volumes, repeat, priority, private status, notes, hidden from status lists status, advanced scores, started at date, completed at date, and a required array of ids.
 */
export interface UpdateMediaListEntriesVariables {
  /**
   * `status` is a `MediaListStatus` representing the status of the media list entries.
   */
  status?: MediaListStatus

  /**
   * `score` is a number representing the score of the media list entries.
   */
  score?: number

  /**
   * `scoreRaw` is a number representing the raw score of the media list entries.
   */
  scoreRaw?: number

  /**
   * `progress` is a number representing the progress of the media list entries.
   */
  progress?: number

  /**
   * `progressVolumes` is a number representing the progress volumes of the media list entries.
   */
  progressVolumes?: number

  /**
   * `repeat` is a number representing the repeat status of the media list entries.
   */
  repeat?: number

  /**
   * `priority` is a number representing the priority of the media list entries.
   */
  priority?: number

  /**
   * `private` is a boolean representing the privacy status of the media list entries.
   */
  private?: boolean

  /**
   * `notes` is a string representing the notes of the media list entries.
   */
  notes?: string

  /**
   * `hiddenFromStatusLists` is a boolean representing whether the media list entries are hidden from status lists.
   */
  hiddenFromStatusLists?: boolean

  /**
   * `advancedScores` is an array of numbers representing the advanced scores of the media list entries.
   */
  advancedScores?: number[]

  /**
   * `startedAt` is a `FuzzyDateInput` representing when the media list entries started.
   */
  startedAt?: FuzzyDateInput

  /**
   * `completedAt` is a `FuzzyDateInput` representing when the media list entries were completed.
   */
  completedAt?: FuzzyDateInput

  /**
   * `ids` is an array of numbers representing the ids of the media list entries.
   */
  ids: number[]
}

/**
 * `UpdateMediaListEntriesMutation` is a class representing a mutation to update media list entries.
 * It includes a method to update media list entries.
 */
export class UpdateMediaListEntriesMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `UpdateMediaListEntriesMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `updateMediaListEntries` is a method that sends a mutation request to update media list entries.
   *
   * @param variables - The variables for the mutation.
   * @returns The response from the mutation request.
   */
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
