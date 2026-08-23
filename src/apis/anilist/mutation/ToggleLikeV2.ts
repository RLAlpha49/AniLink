import { APIWrapper } from "../../../base/APIWrapper";
import { requireVariables, validateVariables } from "../../../base/ValidateVariables";
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
 * `ToggleLikeV2Mutation` is a class representing a mutation to toggle a like.
 * It includes a method to delete an activity
 * @see https://docs.anilist.co/reference/mutation
 */
export class ToggleLikeV2Mutation extends APIWrapper {
    /**
     * `ToggleLikeV2` is a method that sends a mutation request to toggle a like.
     *
     * @param variables - An object of type `ToggleLikeV2Variables` representing the variables for the mutation.
     * @returns A Promise that resolves to a `Likeable` — one of an activity, activity reply, thread,
     * or thread comment, depending on which likeable entity the mutation toggled.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/mutation
     */
    async toggleLikeV2(variables: ToggleLikeV2Variables): Promise<Likeable> {
        requireVariables(
            variables,
            { kind: "all", names: ["id", "type"] },
            "The ToggleLikeV2 mutation requires id and type variables."
        );
        const variableTypeMappings = {
            id: "number",
            type: LikeableTypeMappings,
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($id: Int, $type: LikeableType, $asHtml: Boolean) {
        ToggleLikeV2 (id: $id, type: $type) {
          ${ActivitySchemaV2}
        }
      }
    `;

        return await this.request(mutation, variables, true);
    }
}
