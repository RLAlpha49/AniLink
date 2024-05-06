import { validateVariables } from '../../../base/ValidateVariables'
import { sendRequest } from '../../../base/RequestHandler'
import { APIWrapper } from '../../../base/APIWrapper'
import { type Favourites, FavouritesSchema } from '../interfaces/responses/mutation/Favourites'

/**
 * `ToggleFavouriteVariables` is an interface that contains the variables that are required to toggle a favourite.
 * It includes the id of what to toggle as a favourite.
 */
export interface ToggleFavouriteVariables {
  /**
   * `animeId` is a number representing the id of the anime to toggle as a favourite.
   */
  animeId: number

  /**
   * `mangaId` is a number representing the id of the manga to toggle as a favourite.
   */
  mangaId: number

  /**
   * `characterId` is a number representing the id of the character to toggle as a favourite.
   */
  characterId: number

  /**
   * `staffId` is a number representing the id of the staff to toggle as a favourite.
   */
  staffId: number

  /**
   * `studioId` is a number representing the id of the studio to toggle as a favourite.
   */
  studioId: number
}

/**
 * `ToggleFavouriteMutation` is a class that contains the method to toggle a favourite.
 * It includes a method to toggle a favourite.
 */
export class ToggleFavouriteMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ToggleFavouriteMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `toggleFavourite` is a method that sends a mutation request to toggle a favourite.
   *
   * @param variables - An object of type `ToggleFavouriteVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   */
  async toggleFavourite (variables: ToggleFavouriteVariables): Promise<Favourites> {
    if (!this.authToken) {
      throw new Error('ToggleFavouriteMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.animeId && !variables.mangaId && !variables.characterId && !variables.staffId && !variables.studioId) {
      throw new Error('animeId, mangaId, characterId, staffId, or studioId variable is required')
    }
    const variableTypeMappings = {
      animeId: 'number',
      mangaId: 'number',
      characterId: 'number',
      staffId: 'number',
      studioId: 'number'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($animeId: Int, $mangaId: Int, $characterId: Int, $staffId: Int, $studioId: Int) {
        ToggleFavourite (animeId: $animeId, mangaId: $mangaId, characterId: $characterId, staffId: $staffId, studioId: $studioId) {
          ${FavouritesSchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
