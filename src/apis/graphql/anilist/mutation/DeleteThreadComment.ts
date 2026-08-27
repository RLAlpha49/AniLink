import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * {@link DeleteThreadCommentVariables} contains variables for the {@link DeleteThreadCommentMutation} operation.
 *
 * See the {@link DeleteThreadCommentMutation} operation and {@link DeleteResult} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/deleted
 */
export interface DeleteThreadCommentVariables {
    /**
     * `id` is a number representing the id of the activity.
     */
    id: number;
}

/**
 * Validation metadata maps {@link DeleteThreadCommentVariables} to runtime types for the
 * `deleteThreadComment` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteThreadCommentMappings = {
    id: "number",
};

/**
 * {@link DeleteThreadCommentMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link DeleteThreadCommentMutation.deleteThreadComment}; variables use
 * {@link DeleteThreadCommentVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteThreadCommentMutation extends AniListOperation {
    /**
     * {@link DeleteThreadCommentMutation.deleteThreadComment} sends a mutation request to delete a thread comment.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the comment was deleted by this
     * call; a `false` value means the comment was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - Values from {@link DeleteThreadCommentVariables} for the mutation.
     * @returns The {@link DeleteResult} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new DeleteThreadCommentMutation("your-token").deleteThreadComment({ id: 1 });
     * ```
     */
    async deleteThreadComment(
        variables: DeleteThreadCommentVariables,
        options?: RequestOptions
    ): Promise<DeleteResult> {
        const mutation = `
      mutation ($id: Int) {
        DeleteThreadComment (id: $id) {
          deleted
        }
      }
    `;
        return await this.execute<DeleteResult>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id"],
                    message: "The DeleteThreadComment mutation requires an id variable.",
                },
            ],
            mappings: DeleteThreadCommentMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
