import { APIWrapper } from "../../../base/APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * `DeleteActivityMutation` is an interface representing the variables to delete an activity.
 * It includes the activity id.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface DeleteActivityVariables {
    /**
     * `id` is a number representing the id of the activity.
     */
    id: number;
}

/**
 * The variable type mappings for the `deleteActivity` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteActivityMappings = {
    id: "number",
};

/**
 * `DeleteActivityMutation` is a class representing a mutation to delete a activity.
 * It includes a method to delete an activity
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteActivityMutation extends APIWrapper {
    /**
     * `deleteActivity` is a method that sends a mutation request to delete a activity.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the activity was deleted by
     * this call; a `false` value means the activity was not present (already deleted or never
     * existed). The mutation is therefore safe to retry after a partial failure: a `false` result
     * confirms the target is gone rather than reporting an error.
     *
     * @param variables - An object of type `DeleteActivityVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to `{ deleted }`, where `deleted` is `true` when the activity was deleted by this call and `false` when it was already absent.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async deleteActivity(
        variables: DeleteActivityVariables,
        options?: RequestOptions
    ): Promise<DeleteResult> {
        const mutation = `
      mutation ($id: Int) {
        DeleteActivity(id: $id) {
          deleted
        }
      }
    `;
        return await this.execute<DeleteResult>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id"],
                    message: "The DeleteActivity mutation requires an id variable.",
                },
            ],
            mappings: DeleteActivityMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
