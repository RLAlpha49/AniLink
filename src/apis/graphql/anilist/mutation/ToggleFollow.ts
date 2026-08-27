import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type UserResponse } from "../interfaces/responses/query/User";
import { BasicUserSchema } from "../schemas/Basic";

/**
 * {@link ToggleFollowVariables} contains variables for the {@link ToggleFollowMutation} operation.
 *
 * See the {@link ToggleFollowMutation} operation and {@link UserResponse} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/user
 */
export interface ToggleFollowVariables {
    /**
     * `userId` is a number representing the id of the user to follow.
     */
    userId: number;
}

/**
 * Validation metadata maps {@link ToggleFollowVariables} to runtime types for the
 * `toggleFollow` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ToggleFollowMappings = {
    userId: "number",
};

/**
 * {@link ToggleFollowMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link ToggleFollowMutation.toggleFollow}; variables use
 * {@link ToggleFollowVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/user
 */
export class ToggleFollowMutation extends AniListOperation {
    /**
     * {@link ToggleFollowMutation.toggleFollow} sends a mutation request to toggle a follow.
     *
     * @param variables - Values from {@link ToggleFollowVariables} for the mutation.
     * @returns The {@link UserResponse} returned by the mutation.
     * @throws Throws if no authentication token is configured, `userId` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ToggleFollowMutation("your-token").toggleFollow({ userId: 1 });
     * ```
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
