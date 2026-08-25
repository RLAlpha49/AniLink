import { APIWrapper } from "../APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type DeleteResult } from "../types/DeleteResult";
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
 * The variable type mappings for the `deleteCustomList` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteCustomListMappings = {
    customList: "string",
    type: MediaTypeMappings,
};

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
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async deleteCustomList(
        variables: DeleteCustomListVariables,
        options?: RequestOptions
    ): Promise<DeleteResult> {
        const mutation = `
      mutation ($customList: String, $type: MediaType) {
        DeleteCustomList(customList: $customList, type: $type) {
          deleted
        }
      }
    `;
        return await this.execute<DeleteResult>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["customList", "type"],
                    message:
                        "The DeleteCustomList mutation requires customList and type variables.",
                },
            ],
            mappings: DeleteCustomListMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
