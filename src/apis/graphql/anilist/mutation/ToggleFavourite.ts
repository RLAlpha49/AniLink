import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type Favourites } from "../interfaces/responses/mutation/Favourites";
import { FavouritesSchema } from "../schemas/responses/mutation/Favourites";

/**
 * {@link ToggleFavouriteVariables} contains variables for the {@link ToggleFavouriteMutation} operation.
 *
 * See the {@link ToggleFavouriteMutation} operation and {@link Favourites} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/favourites
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
 * Validation metadata maps {@link ToggleFavouriteVariables} to runtime types for the
 * `toggleFavourite` operation.
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
 * {@link ToggleFavouriteMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link ToggleFavouriteMutation.toggleFavourite}; variables use
 * {@link ToggleFavouriteVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/favourites
 */
export class ToggleFavouriteMutation extends AniListOperation {
    /**
     * {@link ToggleFavouriteMutation.toggleFavourite} sends a mutation request to toggle a favourite.
     *
     * @param variables - Values from {@link ToggleFavouriteVariables} for the mutation.
     * @returns The {@link Favourites} returned by the mutation.
     * @throws Throws if no authentication token is configured, at least one favourite ID is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/favourites
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ToggleFavouriteMutation("your-token").toggleFavourite({ animeId: 1, mangaId: 1, characterId: 1, staffId: 1, studioId: 1 });
     * ```
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
