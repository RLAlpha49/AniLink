import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type LikeableType, LikeableTypeMappings } from "../types/Type";
import { type Likeable } from "../interfaces/Likeable";
import { ActivitySchemaV2 } from "../schemas/Activity";

/**
 * {@link ToggleLikeV2Variables} contains variables for the {@link ToggleLikeV2Mutation} operation.
 *
 * See {@link ToggleLikeV2Mutation} and {@link Likeable} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/union/likeableunion
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
 * Validation metadata maps {@link ToggleLikeV2Variables} to runtime types for the
 * `toggleLikeV2` operation.
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
 * {@link ToggleLikeV2Mutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link ToggleLikeV2Mutation.toggleLikeV2}; variables use
 * {@link ToggleLikeV2Variables} and validation uses `ToggleLikeV2Mappings`.
 * @see https://docs.anilist.co/reference/union/likeableunion
 */
export class ToggleLikeV2Mutation extends AniListOperation {
    /**
     * {@link ToggleLikeV2Mutation.toggleLikeV2} sends a mutation request to toggle a like.
     *
     * @param variables - Values from {@link ToggleLikeV2Variables} for the mutation.
     * @returns The {@link Likeable} returned by the mutation: an activity, activity reply, thread, or thread comment.
     * @throws Throws if no authentication token is configured, `id` or `type` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/union/likeableunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ToggleLikeV2Mutation("your-token").toggleLikeV2({ id: 1, type: "ACTIVITY" });
     * ```
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
