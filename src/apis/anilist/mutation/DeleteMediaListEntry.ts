import { APIWrapper } from "../APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type DeleteMediaListEntryResponse } from "../interfaces/responses/mutation/DeleteMediaListEntry";

/**
 * `DeleteMediaListEntryMutation` is an interface representing the variables to delete a media list entry.
 * It includes the `id` of the media list entry to delete.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface DeleteMediaListEntryVariables {
    /**
     * `id` is a number representing the media list entry ID.
     */
    id: number;
}

/**
 * The variable type mappings for the `deleteMediaListEntry` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteMediaListEntryMappings = {
    id: "number",
};

/**
 * `DeleteMediaListEntryMutation` is a class representing a mutation to delete a media list entry.
 * It includes a method to delete a media list entry.
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteMediaListEntryMutation extends APIWrapper {
    /**
     * `deleteMediaListEntry` is a method that sends a mutation request to delete a media list entry.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the entry was deleted by this
     * call; a `false` value means the entry was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - An object of type `DeleteMediaListEntryVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to `{ deleted }`, where `deleted` is `true` when the entry was deleted by this call and `false` when it was already absent.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async deleteMediaListEntry(
        variables: DeleteMediaListEntryVariables,
        options?: RequestOptions
    ): Promise<DeleteMediaListEntryResponse> {
        const mutation = `
      mutation ($id: Int) {
        DeleteMediaListEntry(id: $id) {
          deleted
        }
      }
    `;
        return await this.execute<DeleteMediaListEntryResponse>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id"],
                    message: "The DeleteMediaListEntry mutation requires an id variable.",
                },
            ],
            mappings: DeleteMediaListEntryMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
