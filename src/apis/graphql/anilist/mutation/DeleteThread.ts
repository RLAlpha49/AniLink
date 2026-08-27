import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * {@link DeleteThreadVariables} contains variables for the {@link DeleteThreadMutation} operation.
 *
 * See the {@link DeleteThreadMutation} operation and {@link DeleteResult} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/deleted
 */
export interface DeleteThreadVariables {
    /**
     * `id` is a number representing the id of the activity.
     */
    id: number;
}

/**
 * Validation metadata maps {@link DeleteThreadVariables} to runtime types for the
 * `deleteThread` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteThreadMappings = {
    id: "number",
};

/**
 * {@link DeleteThreadMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link DeleteThreadMutation.deleteThread}; variables use
 * {@link DeleteThreadVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteThreadMutation extends AniListOperation {
    /**
     * {@link DeleteThreadMutation.deleteThread} sends a mutation request to delete a thread.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the thread was deleted by this
     * call; a `false` value means the thread was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - Values from {@link DeleteThreadVariables} for the mutation.
     * @returns The {@link DeleteResult} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new DeleteThreadMutation("your-token").deleteThread({ id: 1 });
     * ```
     */
    async deleteThread(
        variables: DeleteThreadVariables,
        options?: RequestOptions
    ): Promise<DeleteResult> {
        const mutation = `
      mutation ($id: Int) {
        DeleteThread (id: $id) {
          deleted
        }
      }
    `;
        return await this.execute<DeleteResult>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id"],
                    message: "The DeleteThread mutation requires an id variable.",
                },
            ],
            mappings: DeleteThreadMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
