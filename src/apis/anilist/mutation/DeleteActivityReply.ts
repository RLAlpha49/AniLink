import { APIWrapper } from "../../../base/APIWrapper";
import { type DeleteResult } from "../types/DeleteResult";
import { requireVariables, validateVariables } from "../../../base/ValidateVariables";

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
 * `DeleteActivityReplyMutation` is a class representing a mutation to delete an activity reply.
 * It includes a method to delete an activity
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteActivityReplyMutation extends APIWrapper {
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
     */
    async deleteActivityReply(variables: DeleteActivityReplyVariables): Promise<DeleteResult> {
        requireVariables(
            variables,
            { kind: "all", names: ["id"] },
            "The DeleteActivityReply mutation requires an id variable."
        );
        const variableTypeMappings = {
            id: "number",
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($id: Int) {
        DeleteActivityReply (id: $id) {
          deleted
        }
      }
    `;

        return await this.request(mutation, variables, true);
    }
}
