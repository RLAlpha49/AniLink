import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * {@link DeleteActivityReplyVariables} contains variables for the {@link DeleteActivityReplyMutation} operation.
 *
 * See the {@link DeleteActivityReplyMutation} operation and {@link DeleteResult} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/deleted
 */
export interface DeleteActivityReplyVariables {
    /**
     * `id` is a number representing the id of the activity reply.
     */
    id: number;
}

/**
 * Validation metadata maps {@link DeleteActivityReplyVariables} to runtime types for the
 * `deleteActivityReply` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteActivityReplyMappings = {
    id: "number",
};

/**
 * {@link DeleteActivityReplyMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link DeleteActivityReplyMutation.deleteActivityReply}; variables use
 * {@link DeleteActivityReplyVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteActivityReplyMutation extends AniListOperation {
    /**
     * {@link DeleteActivityReplyMutation.deleteActivityReply} sends a mutation request to delete an activity reply.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the reply was deleted by this
     * call; a `false` value means the reply was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - Values from {@link DeleteActivityReplyVariables} for the mutation.
     * @returns The {@link DeleteResult} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new DeleteActivityReplyMutation("your-token").deleteActivityReply({ id: 1 });
     * ```
     */
    async deleteActivityReply(
        variables: DeleteActivityReplyVariables,
        options?: RequestOptions
    ): Promise<DeleteResult> {
        const mutation = `
      mutation ($id: Int) {
        DeleteActivityReply (id: $id) {
          deleted
        }
      }
    `;
        return await this.execute<DeleteResult>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id"],
                    message: "The DeleteActivityReply mutation requires an id variable.",
                },
            ],
            mappings: DeleteActivityReplyMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
