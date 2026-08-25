import { APIWrapper } from "../APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type Favourites } from "../interfaces/responses/mutation/Favourites";
import { FavouritesSchema } from "../schemas/responses/mutation/Favourites";

/**
 * `ToggleFavouriteVariables` is an interface that contains the variables that are required to toggle a favourite.
 * It includes the id of what to toggle as a favourite.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface ToggleFavouriteVariables {
    /**
     * `animeId` is a number representing the id of the anime to toggle as a favourite.
     */
    animeId: number;

    /**
     * `mangaId` is a number representing the id of the manga to toggle as a favourite.
     */
    mangaId: number;

    /**
     * `characterId` is a number representing the id of the character to toggle as a favourite.
     */
    characterId: number;

    /**
     * `staffId` is a number representing the id of the staff to toggle as a favourite.
     */
    staffId: number;

    /**
     * `studioId` is a number representing the id of the studio to toggle as a favourite.
     */
    studioId: number;
}

/**
 * The variable type mappings for the `toggleFavourite` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ToggleFavouriteMappings = {
    animeId: "number",
    mangaId: "number",
    characterId: "number",
    staffId: "number",
    studioId: "number",
};

/**
 * `ToggleFavouriteMutation` is a class that contains the method to toggle a favourite.
 * It includes a method to toggle a favourite.
 * @see https://docs.anilist.co/reference/object/favourites
 */
export class ToggleFavouriteMutation extends APIWrapper {
    /**
     * `toggleFavourite` is a method that sends a mutation request to toggle a favourite.
     *
     * @param variables - An object of type `ToggleFavouriteVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/favourites
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async toggleFavourite(
        variables: ToggleFavouriteVariables,
        options?: RequestOptions
    ): Promise<Favourites> {
        const mutation = `
      mutation ($animeId: Int, $mangaId: Int, $characterId: Int, $staffId: Int, $studioId: Int) {
        ToggleFavourite (animeId: $animeId, mangaId: $mangaId, characterId: $characterId, staffId: $staffId, studioId: $studioId) {
          ${FavouritesSchema}
        }
      }
    `;
        return await this.execute<Favourites>(mutation, variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["animeId", "mangaId", "characterId", "staffId", "studioId"],
                    message:
                        "The ToggleFavourite mutation requires an animeId, mangaId, characterId, staffId, or studioId variable.",
                },
            ],
            mappings: ToggleFavouriteMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
