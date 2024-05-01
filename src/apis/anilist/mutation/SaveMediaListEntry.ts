import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { FuzzyDateSchema } from '../interfaces/FuzzyDate'
import { type FuzzyDateInput, FuzzyDateMappings } from '../types/FuzzyDate'
import { validateVariables } from '../../../base/ValidateVariables'
import { type MediaListStatus, MediaListStatusMappings } from '../types/Status'

/**
 * `SaveMediaListEntryVariables` is an interface representing the variables for the `SaveMediaListEntryMutation`.
 * It includes optional id, media id, status, score, raw score, progress, progress volumes, repeat, priority, private status, notes, hidden from status lists status, custom lists, advanced scores, started at date, and completed at date.
 */
export interface SaveMediaListEntryVariables {
  /**
   * `id` is a number representing the id of the media list entry.
   */
  id?: number

  /**
   * `mediaId` is a number representing the id of the media associated with the media list entry.
   */
  mediaId: number

  /**
   * `status` is a `MediaListStatus` representing the status of the media list entry.
   */
  status?: MediaListStatus

  /**
   * `score` is a number representing the score of the media list entry.
   */
  score?: number

  /**
   * `scoreRaw` is a number representing the raw score of the media list entry.
   */
  scoreRaw?: number

  /**
   * `progress` is a number representing the progress of the media list entry.
   */
  progress?: number

  /**
   * `progressVolumes` is a number representing the progress volumes of the media list entry.
   */
  progressVolumes?: number

  /**
   * `repeat` is a number representing the repeat status of the media list entry.
   */
  repeat?: number

  /**
   * `priority` is a number representing the priority of the media list entry.
   */
  priority?: number

  /**
   * `private` is a boolean representing the privacy status of the media list entry.
   */
  private?: boolean

  /**
   * `notes` is a string representing the notes of the media list entry.
   */
  notes?: string

  /**
   * `hiddenFromStatusLists` is a boolean representing whether the media list entry is hidden from status lists.
   */
  hiddenFromStatusLists?: boolean

  /**
   * `customLists` is an array of strings representing the custom lists of the media list entry.
   */
  customLists?: string[]

  /**
   * `advancedScores` is an array of numbers representing the advanced scores of the media list entry.
   */
  advancedScores?: number[]

  /**
   * `startedAt` is a `FuzzyDateInput` representing when the media list entry started.
   */
  startedAt?: FuzzyDateInput

  /**
   * `completedAt` is a `FuzzyDateInput` representing when the media list entry was completed.
   */
  completedAt?: FuzzyDateInput
}

/**
 * `SaveMediaListEntryMutation` is a class representing a mutation to save a media list entry.
 * It includes a method to save a media list entry.
 */
export class SaveMediaListEntryMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `SaveMediaListEntryMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `saveMediaListEntry` is a method that sends a mutation request to save a media list entry.
   *
   * @param variables - An object of type `SaveMediaListEntryVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   */
  async saveMediaListEntry (variables: SaveMediaListEntryVariables): Promise<any> {
    if (variables.mediaId === undefined) {
      throw new Error('mediaId is required for SaveMediaListEntryMutation')
    }

    const variableTypeMappings = {
      id: 'number',
      mediaId: 'number',
      status: MediaListStatusMappings,
      score: 'number',
      scoreRaw: 'number',
      progress: 'number',
      progressVolumes: 'number',
      repeat: 'number',
      priority: 'number',
      private: 'boolean',
      notes: 'string',
      hiddenFromStatusLists: 'boolean',
      customLists: 'string[]',
      advancedScores: 'number[]',
      startedAt: FuzzyDateMappings,
      completedAt: FuzzyDateMappings
    }

    validateVariables(variables, variableTypeMappings)

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
