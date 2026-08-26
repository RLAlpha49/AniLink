import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * `DeleteThreadCommentVariables` is an interface representing the variables to delete a thread comment.
 * It includes the id of the thread comment.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface DeleteThreadCommentVariables {
    /**
     * `id` is a number representing the id of the activity.
     */
    id: number;
}

/**
 * The variable type mappings for the `deleteThreadComment` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteThreadCommentMappings = {
    id: "number",
};

/**
 * `DeleteThreadCommentMutation` is a class representing a mutation to delete a thread comment.
 * It includes a method to delete a thread
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteThreadCommentMutation extends AniListOperation {
    /**
     * `deleteThreadComment` is a method that sends a mutation request to delete a thread comment.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the comment was deleted by this
     * call; a `false` value means the comment was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - An object of type `DeleteThreadCommentVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to `{ deleted }`, where `deleted` is `true` when the comment was deleted by this call and `false` when it was already absent.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
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
