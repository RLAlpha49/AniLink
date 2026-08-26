import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * `DeleteActivityReplyMutation` is an interface representing the variables to delete an activity reply.
 * It includes the activity reply id.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface DeleteActivityReplyVariables {
    /**
     * `id` is a number representing the id of the activity reply.
     */
    id: number;
}

/**
 * The variable type mappings for the `deleteActivityReply` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteActivityReplyMappings = {
    id: "number",
};

/**
 * `DeleteActivityReplyMutation` is a class representing a mutation to delete an activity reply.
 * It includes a method to delete an activity
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteActivityReplyMutation extends AniListOperation {
    /**
     * `DeleteActivityReply` is a method that sends a mutation request to delete an activity reply.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the reply was deleted by this
     * call; a `false` value means the reply was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - An object of type `DeleteActivityReplyVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to `{ deleted }`, where `deleted` is `true` when the reply was deleted by this call and `false` when it was already absent.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
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
