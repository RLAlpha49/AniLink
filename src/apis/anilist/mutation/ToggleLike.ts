import { APIWrapper } from "../../../base/APIWrapper";
import { type LikeableType, LikeableTypeMappings } from "../types/Type";
import { BasicUserSchema } from "../schemas/Basic";
import { type BasicUser } from "../interfaces/Basic";

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
 * @see https://docs.anilist.co/reference/object/user
 */
export class ToggleLikeMutation extends APIWrapper {
    /**
     * `ToggleLike` is a method that sends a mutation request to toggle a like.
     *
     * @param variables - An object of type `ToggleLikeVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the user who performed the like toggle.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/object/user
     */
    async toggleLike(variables: ToggleLikeVariables): Promise<BasicUser> {
        const mutation = `
      mutation ($id: Int, $type: LikeableType) {
        ToggleLike (id: $id, type: $type) {
          ${BasicUserSchema}
        }
      }
    `;
        return await this.execute<BasicUser>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id", "type"],
                    message: "The ToggleLike mutation requires id and type variables.",
                },
            ],
            mappings: {
                id: "number",
                type: LikeableTypeMappings,
            },
            requiresAuth: true,
        });
    }
}
