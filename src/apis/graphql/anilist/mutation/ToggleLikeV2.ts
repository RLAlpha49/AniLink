import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type LikeableType, LikeableTypeMappings } from "../types/Type";
import { type Likeable } from "../interfaces/Likeable";
import { ActivitySchemaV2 } from "../schemas/Activity";

/**
 * `ToggleLikeV2Mutation` is an interface representing the variables to toggle a like.
 * It includes the id of the likeable object and the type of the likeable object.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface ToggleLikeV2Variables {
    /**
     * `id` is a number representing the id of the likeable object.
     */
    id: number;

    /**
     * `type` is a string representing the type of the likeable object.
     */
    type: LikeableType;

    /**
     * `asHtml` is a boolean representing whether the response should be in HTML format.
     */
    asHtml?: boolean;
}

/**
 * The variable type mappings for the `toggleLikeV2` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ToggleLikeV2Mappings = {
    id: "number",
    type: LikeableTypeMappings,
    asHtml: "boolean",
};

/**
 * `ToggleLikeV2Mutation` is a class representing a mutation to toggle a like.
 * It includes a method to delete an activity
 * @see https://docs.anilist.co/reference/union/likeableunion
 */
export class ToggleLikeV2Mutation extends AniListOperation {
    /**
     * `ToggleLikeV2` is a method that sends a mutation request to toggle a like.
     *
     * @param variables - An object of type `ToggleLikeV2Variables` representing the variables for the mutation.
     * @returns A Promise that resolves to a `Likeable` — one of an activity, activity reply, thread,
     * or thread comment, depending on which likeable entity the mutation toggled.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/union/likeableunion
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async toggleLikeV2(
        variables: ToggleLikeV2Variables,
        options?: RequestOptions
    ): Promise<Likeable> {
        const mutation = `
      mutation ($id: Int, $type: LikeableType, $asHtml: Boolean) {
        ToggleLikeV2 (id: $id, type: $type) {
          ${ActivitySchemaV2}
        }
      }
    `;
        return await this.execute<Likeable>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id", "type"],
                    message: "The ToggleLikeV2 mutation requires id and type variables.",
                },
            ],
            mappings: ToggleLikeV2Mappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
