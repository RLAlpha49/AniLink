import { APIWrapper } from "../../../base/APIWrapper";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * `DeleteThreadVariables` is an interface representing the variables to delete a thread.
 * It includes the thread id.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface DeleteThreadVariables {
    /**
     * `id` is a number representing the id of the activity.
     */
    id: number;
}

/**
 * `DeleteThreadMutation` is a class representing a mutation to delete a thread.
 * It includes a method to delete a thread
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteThreadMutation extends APIWrapper {
    /**
     * `deleteThread` is a method that sends a mutation request to delete a thread.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the thread was deleted by this
     * call; a `false` value means the thread was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - An object of type `DeleteThreadVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to `{ deleted }`, where `deleted` is `true` when the thread was deleted by this call and `false` when it was already absent.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/deleted
     */
    async deleteThread(variables: DeleteThreadVariables): Promise<DeleteResult> {
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
            mappings: {
                id: "number",
            },
            requiresAuth: true,
        });
    }
}
