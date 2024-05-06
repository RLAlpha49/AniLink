/**
 * `UpdateFavouriteOrderVariables` is an interface that contains the variables that are required to update the order of the favourite anime/manga.
 */
import { sendRequest } from '../../../base/RequestHandler'
import { APIWrapper } from '../../../base/APIWrapper'
import { type Favourites, FavouritesSchema } from '../interfaces/responses/mutation/Favourites'
import { validateVariables } from '../../../base/ValidateVariables'

export interface UpdateFavouriteOrderVariables {
  /**
   * `animeIds` is an array of numbers representing the ids of the anime to update the order of.
   */
  animeIds: number[]

  /**
   * `mangaIds` is an array of numbers representing the ids of the manga to update the order of.
   */
  mangaIds: number[]

  /**
   * `characterIds` is an array of numbers representing the ids of the characters to update the order of.
   */
  characterIds: number[]

  /**
   * `staffIds` is an array of numbers representing the ids of the staff to update the order of.
   */
  staffIds: number[]

  /**
   * `studioIds` is an array of numbers representing the ids of the studios to update the order of.
   */
  studioIds: number[]

  /**
   * `animeOrder` is an array of numbers representing the order of the anime.
   */
  animeOrder: number[]

  /**
   * `mangaOrder` is an array of numbers representing the order of the manga.
   */
  mangaOrder: number[]

  /**
   * `characterOrder` is an array of numbers representing the order of the characters.
   */
  characterOrder: number[]

  /**
   * `staffOrder` is an array of numbers representing the order of the staff.
   */
  staffOrder: number[]

  /**
   * `studioOrder` is an array of numbers representing the order of the studios.
   */
  studioOrder: number[]
}

/**
 * `UpdateFavouriteOrderMutation` is a class that contains the method to update the order of the favourites.
 * It includes a method to update the order of the favourites.
 */
export class UpdateFavouriteOrderMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `UpdateFavouriteOrderMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `updateFavouriteOrder` is a method that sends a mutation request to update the order of the favourites.
   *
   * @param variables - An object of type `UpdateFavouriteOrderVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   */
  async updateFavouriteOrder (variables: UpdateFavouriteOrderVariables): Promise<Favourites> {
    if (!this.authToken) {
      throw new Error('ToggleFavouriteMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if ((!variables.animeIds && variables.animeOrder) || (!variables.mangaIds && variables.mangaOrder) || (!variables.characterIds && variables.characterOrder) || (!variables.staffIds && variables.staffOrder) || (!variables.studioIds && variables.studioOrder)) {
      throw new Error('The order array requires the corresponding id array to be present.')
    }
    const variableTypeMappings = {
      animeIds: 'number[]',
      mangaIds: 'number[]',
      characterIds: 'number[]',
      staffIds: 'number[]',
      studioIds: 'number[]',
      animeOrder: 'number[]',
      mangaOrder: 'number[]',
      characterOrder: 'number[]',
      staffOrder: 'number[]',
      studioOrder: 'number[]'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($animeIds: [Int], $mangaIds: [Int], $characterIds: [Int], $staffIds: [Int], $studioIds: [Int], $animeOrder: [Int], $mangaOrder: [Int], $characterOrder: [Int], $staffOrder: [Int], $studioOrder: [Int]) {
        UpdateFavouriteOrder (animeIds: $animeIds, mangaIds: $mangaIds, characterIds: $characterIds, staffIds: $staffIds, studioIds: $studioIds, animeOrder: $animeOrder, mangaOrder: $mangaOrder, characterOrder: $characterOrder, staffOrder: $staffOrder, studioOrder: $studioOrder) {
          ${FavouritesSchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
