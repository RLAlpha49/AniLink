import { APIWrapper } from "../../../base/APIWrapper";
import { type DeleteResult } from "../types/DeleteResult";
import { requireVariables, validateVariables } from "../../../base/ValidateVariables";
import { type MediaType, MediaTypeMappings } from "../types/Type";

/**
 * `DeleteCustomListMutation` is an interface representing the variables to delete a custom list.
 * It includes the `customList` and `type` variables of the custom list to delete.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface DeleteCustomListVariables {
    /**
     * `customList` is a string representing the custom list to delete.
     */
    customList: string;

    /**
     * `type` is a string representing the type of the media.
     */
    type: MediaType;
}

/**
 * `DeleteCustomListMutation` is a class representing a mutation to delete a custom list.
 * It includes a method to delete a custom list
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteCustomListMutation extends APIWrapper {
    /**
     * `deleteCustomList` is a method that sends a mutation request to delete a custom list.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the custom list was deleted by
     * this call; a `false` value means the list was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - An object of type `DeleteCustomListVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to `{ deleted }`, where `deleted` is `true` when the custom list was deleted by this call and `false` when it was already absent.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/deleted
     */
    async deleteCustomList(variables: DeleteCustomListVariables): Promise<DeleteResult> {
        requireVariables(
            variables,
            { kind: "all", names: ["customList", "type"] },
            "The DeleteCustomList mutation requires customList and type variables."
        );
        const variableTypeMappings = {
            customList: "string",
            type: MediaTypeMappings,
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($customList: String, $type: MediaType) {
        DeleteCustomList(customList: $customList, type: $type) {
          deleted
        }
      }
    `;

        return await this.request(mutation, variables, true);
    }
}
