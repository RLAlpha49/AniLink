import { APIWrapper } from "../../../base/APIWrapper";
import { validateVariables } from "../../../base/ValidateVariables";
import { type LikeableType, LikeableTypeMappings } from "../types/Type";
import { BasicUserSchema } from "../schemas/Basic";

/**
 * `ToggleLikeMutation` is an interface representing the variables to toggle a like.
 * It includes the id of the likeable object and the type of the likeable object.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface ToggleLikeVariables {
    /**
     * `id` is a number representing the id of the likeable object.
     */
    id: number;

    /**
     * `type` is a string representing the type of the likeable object.
     */
    type: LikeableType;
}

/**
 * `ToggleLikeMutation` is a class representing a mutation to toggle a like.
 * It includes a method to delete an activity
 * @see https://docs.anilist.co/reference/mutation
 */
export class ToggleLikeMutation extends APIWrapper {
    /**
     * `ToggleLike` is a method that sends a mutation request to toggle a like.
     *
     * @param variables - An object of type `ToggleLikeVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/mutation
     */
    async toggleLike(variables: ToggleLikeVariables): Promise<any> {
        if (!variables.id || !variables.type) {
            throw new Error("id and type variables are required.");
        }
        const variableTypeMappings = {
            id: "number",
            type: LikeableTypeMappings,
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($id: Int, $type: LikeableType) {
        ToggleLike (id: $id, type: $type) {
          ${BasicUserSchema}
        }
      }
    `;

        return await this.request(mutation, variables, true);
    }
}
