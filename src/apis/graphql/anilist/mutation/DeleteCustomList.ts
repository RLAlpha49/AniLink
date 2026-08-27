import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type DeleteResult } from "../types/DeleteResult";
import { type MediaType, MediaTypeMappings } from "../types/Type";

/**
 * {@link DeleteCustomListVariables} contains variables for the {@link DeleteCustomListMutation} operation.
 *
 * See the {@link DeleteCustomListMutation} operation and {@link DeleteResult} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/deleted
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
 * Validation metadata maps {@link DeleteCustomListVariables} to runtime types for the
 * `deleteCustomList` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteCustomListMappings = {
    customList: "string",
    type: MediaTypeMappings,
};

/**
 * {@link DeleteCustomListMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link DeleteCustomListMutation.deleteCustomList}; variables use
 * {@link DeleteCustomListVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteCustomListMutation extends AniListOperation {
    /**
     * {@link DeleteCustomListMutation.deleteCustomList} sends a mutation request to delete a custom list.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the custom list was deleted by
     * this call; a `false` value means the list was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - Values from {@link DeleteCustomListVariables} for the mutation.
     * @returns The {@link DeleteResult} returned by the mutation.
     * @throws Throws if no authentication token is configured, `customList` or `type` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new DeleteCustomListMutation("your-token").deleteCustomList({ customList: "watching", type: "ANIME" });
     * ```
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
