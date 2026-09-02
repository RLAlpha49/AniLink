import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type LikeableType, LikeableTypeMappings } from "../types/Type";
import { BasicUserSchema } from "../schemas/Basic";
import { type BasicUser } from "../interfaces/Basic";

/**
 * {@link ToggleLikeVariables} contains variables for the {@link ToggleLikeMutation} operation.
 *
 * See {@link ToggleLikeMutation} and {@link BasicUser} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/user
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
 * Validation metadata maps {@link ToggleLikeVariables} to runtime types for the
 * `toggleLike` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ToggleLikeMappings = {
    id: "number",
    type: LikeableTypeMappings,
};

/**
 * {@link ToggleLikeMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link ToggleLikeMutation.toggleLike}; variables use
 * {@link ToggleLikeVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/user
 */
export class ToggleLikeMutation extends AniListOperation {
    /**
     * {@link ToggleLikeMutation.toggleLike} sends a mutation request to toggle a like.
     *
     * @deprecated Prefer {@link ToggleLikeV2Mutation.toggleLikeV2}, which returns the richer {@link Likeable} union (activity, activity reply, thread, or thread comment) instead of a bare user.
     * @param variables - Values from {@link ToggleLikeVariables} for the mutation.
     * @returns The {@link BasicUser} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` or `type` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/user
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ToggleLikeMutation("your-token").toggleLike({ id: 1, type: "ACTIVITY" });
     * ```
     */
    async toggleLike(variables: ToggleLikeVariables, options?: RequestOptions): Promise<BasicUser> {
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
            mappings: ToggleLikeMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
