import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * {@link DeleteReviewVariables} contains variables for the {@link DeleteReviewMutation} operation.
 *
 * See the {@link DeleteReviewMutation} operation and {@link DeleteResult} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/deleted
 */
export interface DeleteReviewVariables {
    /**
     * `id` is the ID of the review.
     */
    id: number;
}

/**
 * Validation metadata maps {@link DeleteReviewVariables} to runtime types for the
 * `deleteReview` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteReviewMappings = {
    id: "number",
};

/**
 * {@link DeleteReviewMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link DeleteReviewMutation.deleteReview}; variables use
 * {@link DeleteReviewVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteReviewMutation extends AniListOperation {
    /**
     * {@link DeleteReviewMutation.deleteReview} sends a mutation request to delete a review.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the review was deleted by this
     * call; a `false` value means the review was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - Values from {@link DeleteReviewVariables} for the mutation.
     * @returns The {@link DeleteResult} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new DeleteReviewMutation("your-token").deleteReview({ id: 1 });
     * ```
     */
    async deleteReview(
        variables: DeleteReviewVariables,
        options?: RequestOptions
    ): Promise<DeleteResult> {
        const mutation = `
      mutation ($id: Int) {
        DeleteReview(id: $id) {
          deleted
        }
      }
    `;
        return await this.execute<DeleteResult>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id"],
                    message: "The DeleteReview mutation requires an id variable.",
                },
            ],
            mappings: DeleteReviewMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
