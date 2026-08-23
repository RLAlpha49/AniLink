import { APIWrapper } from "../../../base/APIWrapper";
import { type DeleteResult } from "../types/DeleteResult";
import { requireVariables, validateVariables } from "../../../base/ValidateVariables";

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
     */
    async deleteActivity(variables: DeleteActivityVariables): Promise<DeleteResult> {
        requireVariables(
            variables,
            { kind: "all", names: ["id"] },
            "The DeleteActivity mutation requires an id variable."
        );
        const variableTypeMappings = {
            id: "number",
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($id: Int) {
        DeleteActivity(id: $id) {
          deleted
        }
      }
    `;

        return await this.request(mutation, variables, true);
    }
}
