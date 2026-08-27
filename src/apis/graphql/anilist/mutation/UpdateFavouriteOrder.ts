import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type Favourites } from "../interfaces/responses/mutation/Favourites";
import { AniLinkValidationError } from "../../../../base/AniLinkError";
import { FavouritesSchema } from "../schemas/responses/mutation/Favourites";

/**
 * {@link UpdateFavouriteOrderVariables} contains variables for the {@link UpdateFavouriteOrderMutation} operation.
 *
 * See {@link UpdateFavouriteOrderMutation} and {@link Favourites} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/favourites
 */
export interface UpdateFavouriteOrderVariables {
    /**
     * `animeIds` is an array of numbers representing the ids of the anime to update the order of.
     */
    animeIds: number[];

    /**
     * `mangaIds` is an array of numbers representing the ids of the manga to update the order of.
     */
    mangaIds: number[];

    /**
     * `characterIds` is an array of numbers representing the ids of the characters to update the order of.
     */
    characterIds: number[];

    /**
     * `staffIds` is an array of numbers representing the ids of the staff to update the order of.
     */
    staffIds: number[];

    /**
     * `studioIds` is an array of numbers representing the ids of the studios to update the order of.
     */
    studioIds: number[];

    /**
     * `animeOrder` is an array of numbers representing the order of the anime.
     */
    animeOrder: number[];

    /**
     * `mangaOrder` is an array of numbers representing the order of the manga.
     */
    mangaOrder: number[];

    /**
     * `characterOrder` is an array of numbers representing the order of the characters.
     */
    characterOrder: number[];

    /**
     * `staffOrder` is an array of numbers representing the order of the staff.
     */
    staffOrder: number[];

    /**
     * `studioOrder` is an array of numbers representing the order of the studios.
     */
    studioOrder: number[];
}

/**
 * Validation metadata maps {@link UpdateFavouriteOrderVariables} to runtime types for the
 * `updateFavouriteOrder` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const UpdateFavouriteOrderMappings = {
    animeIds: "number[]",
    mangaIds: "number[]",
    characterIds: "number[]",
    staffIds: "number[]",
    studioIds: "number[]",
    animeOrder: "number[]",
    mangaOrder: "number[]",
    characterOrder: "number[]",
    staffOrder: "number[]",
    studioOrder: "number[]",
};

/**
 * {@link UpdateFavouriteOrderMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link UpdateFavouriteOrderMutation.updateFavouriteOrder}; variables use
 * {@link UpdateFavouriteOrderVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/favourites
 */
export class UpdateFavouriteOrderMutation extends AniListOperation {
    /**
     * {@link UpdateFavouriteOrderMutation.updateFavouriteOrder} sends a mutation request to update the order of favourites.
     *
     * @param variables - Values from {@link UpdateFavouriteOrderVariables} for the mutation.
     * @returns The {@link Favourites} returned by the mutation.
     * @throws Throws if no authentication token is configured, an order array lacks its corresponding ID array, a variable has an invalid type, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/favourites
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new UpdateFavouriteOrderMutation("your-token").updateFavouriteOrder({ animeIds: [1], mangaIds: [], characterIds: [], staffIds: [], studioIds: [], animeOrder: [1], mangaOrder: [], characterOrder: [], staffOrder: [], studioOrder: [] });
     * ```
     */
    async updateFavouriteOrder(
        variables: UpdateFavouriteOrderVariables,
        options?: RequestOptions
    ): Promise<Favourites> {
        if (
            (!variables.animeIds && variables.animeOrder) ||
            (!variables.mangaIds && variables.mangaOrder) ||
            (!variables.characterIds && variables.characterOrder) ||
            (!variables.staffIds && variables.staffOrder) ||
            (!variables.studioIds && variables.studioOrder)
        ) {
            throw new AniLinkValidationError([
                "The order array requires the corresponding id array to be present.",
            ]);
        }
        const mutation = `
      mutation ($animeIds: [Int], $mangaIds: [Int], $characterIds: [Int], $staffIds: [Int], $studioIds: [Int], $animeOrder: [Int], $mangaOrder: [Int], $characterOrder: [Int], $staffOrder: [Int], $studioOrder: [Int]) {
        UpdateFavouriteOrder (animeIds: $animeIds, mangaIds: $mangaIds, characterIds: $characterIds, staffIds: $staffIds, studioIds: $studioIds, animeOrder: $animeOrder, mangaOrder: $mangaOrder, characterOrder: $characterOrder, staffOrder: $staffOrder, studioOrder: $studioOrder) {
          ${FavouritesSchema}
        }
      }
    `;
        return await this.execute<Favourites>(mutation, variables, {
            mappings: UpdateFavouriteOrderMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
