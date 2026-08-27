import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type DeleteMediaListEntryResponse } from "../interfaces/responses/mutation/DeleteMediaListEntry";

/**
 * {@link DeleteMediaListEntryVariables} contains variables for the {@link DeleteMediaListEntryMutation} operation.
 *
 * See the {@link DeleteMediaListEntryMutation} operation and {@link DeleteMediaListEntryResponse} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/deleted
 */
export interface DeleteMediaListEntryVariables {
    /**
     * `id` is a number representing the media list entry ID.
     */
    id: number;
}

/**
 * Validation metadata maps {@link DeleteMediaListEntryVariables} to runtime types for the
 * `deleteMediaListEntry` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteMediaListEntryMappings = {
    id: "number",
};

/**
 * {@link DeleteMediaListEntryMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link DeleteMediaListEntryMutation.deleteMediaListEntry}; variables use
 * {@link DeleteMediaListEntryVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteMediaListEntryMutation extends AniListOperation {
    /**
     * {@link DeleteMediaListEntryMutation.deleteMediaListEntry} sends a mutation request to delete a media list entry.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the entry was deleted by this
     * call; a `false` value means the entry was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - Values from {@link DeleteMediaListEntryVariables} for the mutation.
     * @returns The {@link DeleteMediaListEntryResponse} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new DeleteMediaListEntryMutation("your-token").deleteMediaListEntry({ id: 1 });
     * ```
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
