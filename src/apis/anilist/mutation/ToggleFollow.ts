import { APIWrapper } from "../APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
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
 * The variable type mappings for the `toggleFollow` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ToggleFollowMappings = {
    userId: "number",
};

/**
 * `ToggleFollowMutation` is a class representing a mutation to toggle a follow.
 * It includes a method to toggle a follow.
 * @see https://docs.anilist.co/reference/object/user
 */
export class ToggleFollowMutation extends APIWrapper {
    /**
     * `ToggleFollow` is a method that sends a mutation request to toggle a follow.
     *
     * @param variables - An object of type `ToggleFollowVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async toggleFollow(
        variables: ToggleFollowVariables,
        options?: RequestOptions
    ): Promise<UserResponse> {
        const mutation = `
      mutation ($userId: Int) {
        ToggleFollow (userId: $userId) {
          ${BasicUserSchema}
        }
      }
    `;
        return await this.execute<UserResponse>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["userId"],
                    message: "The ToggleFollow mutation requires a userId variable.",
                },
            ],
            mappings: ToggleFollowMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
