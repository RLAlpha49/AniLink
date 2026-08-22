import { APIWrapper } from "../../../base/APIWrapper";
import { requireVariables, validateVariables } from "../../../base/ValidateVariables";
import { type UserResponse } from "../interfaces/responses/query/User";
import { BasicUserSchema } from "../schemas/Basic";

/**
 * `ToggleFollowVariables` is an interface representing the variables to toggle a follow.
 * It includes a number representing the id of the user to follow.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface ToggleFollowVariables {
    /**
     * `userId` is a number representing the id of the user to follow.
     */
    userId: number;
}

/**
 * `ToggleFollowMutation` is a class representing a mutation to toggle a follow.
 * It includes a method to toggle a follow.
 * @see https://docs.anilist.co/reference/mutation
 */
export class ToggleFollowMutation extends APIWrapper {
    /**
     * `ToggleFollow` is a method that sends a mutation request to toggle a follow.
     *
     * @param variables - An object of type `ToggleFollowVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/mutation
     */
    async toggleFollow(variables: ToggleFollowVariables): Promise<UserResponse> {
        requireVariables(
            variables,
            { kind: "all", names: ["userId"] },
            "The ToggleFollow mutation requires a userId variable."
        );
        const variableTypeMappings = {
            userId: "number",
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($userId: Int) {
        ToggleFollow (userId: $userId) {
          ${BasicUserSchema}
        }
      }
    `;

        return await this.request(mutation, variables, true);
    }
}
