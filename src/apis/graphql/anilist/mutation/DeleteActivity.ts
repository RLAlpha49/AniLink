import { AniListOperation } from "../AniListOperation";
import { composeDocument } from "../schemas/selection/composeSelection";
import { splitFieldsOption } from "../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../schemas/selection/fieldsSelection";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * {@link DeleteActivityVariables} contains variables for the {@link DeleteActivityMutation} operation.
 *
 * Holds the `id` of the activity to delete. Use with the {@link DeleteActivityMutation} operation to obtain {@link DeleteResult}.
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/deleted
 */
export interface DeleteActivityVariables {
    /**
     * `id` is a number representing the id of the activity.
     */
    id: number;
}

/**
 * Validation metadata maps {@link DeleteActivityVariables} to runtime types for the
 * `deleteActivity` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const DeleteActivityMappings = {
    id: "number",
};

/**
 * {@link DeleteActivityMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link DeleteActivityMutation.deleteActivity}; variables use
 * {@link DeleteActivityVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteActivityMutation extends AniListOperation {
    /**
     * {@link DeleteActivityMutation.deleteActivity} sends a mutation request to delete an activity.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the activity was deleted by
     * this call; a `false` value means the activity was not present (already deleted or never
     * existed). The mutation is therefore safe to retry after a partial failure: a `false` result
     * confirms the target is gone rather than reporting an error.
     *
     * @param variables - Values from {@link DeleteActivityVariables} for the mutation.
     * @returns The {@link DeleteResult} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/deleted
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only. Pass `fields` to request only a subset of the response — the document is composed from the corresponding selections and the return type narrows to `DeepPick<DeleteResult, K>`. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new DeleteActivityMutation("your-token").deleteActivity({ id: 1 });
     * ```
     */
    async deleteActivity(
        variables: DeleteActivityVariables,
        options?: RequestOptions & { fields?: undefined }
    ): Promise<DeleteResult>;
    async deleteActivity(
        variables: DeleteActivityVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<DeleteResult>;
    async deleteActivity<K extends FieldPath<DeleteResult>>(
        variables: DeleteActivityVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<DeleteResult, K>>;
    async deleteActivity(
        variables: DeleteActivityVariables,
        options?: RequestOptions & FieldsSelection<DeleteResult>
    ): FieldsResult<DeleteResult> {
        const mutation = `
      mutation ($id: Int) {
        DeleteActivity(id: $id) {
          deleted
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<DeleteResult>(composeDocument(mutation, fields, []), variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id"],
                    message: "The DeleteActivity mutation requires an id variable.",
                },
            ],
            mappings: DeleteActivityMappings,
            requiresAuth: true,
            transportOptions,
        });
    }
}
