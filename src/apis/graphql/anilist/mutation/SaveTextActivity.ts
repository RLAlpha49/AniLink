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
import { type Activity, type TextActivity } from "../interfaces/Activity";
import { TextActivitySchema } from "../schemas/Activity";

/**
 * {@link SaveTextActivityVariables} contains variables for the {@link SaveTextActivityMutation} operation.
 *
 * See the {@link SaveTextActivityMutation} operation and {@link Activity} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export interface SaveTextActivityVariables {
    /**
     * `id` is a number representing the id of the activity.
     */
    id: number;

    /**
     * `text` is a string representing the text of the activity.
     */
    text?: string;

    /**
     * `locked` is a boolean representing whether the activity is locked.
     */
    locked?: boolean;

    /**
     * `asHtml` is a boolean representing whether the activity text is returned as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps {@link SaveTextActivityVariables} to runtime types for the
 * `saveTextActivity` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const SaveTextActivityMappings = {
    id: "number",
    text: "string",
    locked: "boolean",
    asHtml: "boolean",
};

/**
 * {@link SaveTextActivityMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link SaveTextActivityMutation.saveTextActivity}; variables use
 * {@link SaveTextActivityVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class SaveTextActivityMutation extends AniListOperation {
    /**
     * {@link SaveTextActivityMutation.saveTextActivity} sends a mutation request to save a text activity.
     *
     * Updates the text activity named by `id` and returns the saved activity. The upstream
     * mutation also creates a new activity when `id` is omitted, but
     * {@link SaveTextActivityVariables} requires `id`, so the typed surface is update-only.
     *
     * @param variables - Values from {@link SaveTextActivityVariables} for the mutation.
     * @returns The {@link Activity} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` or `text` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/union/activityunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only. Pass `fields` to request only a subset of the response — the document is composed from the corresponding selections and the return type narrows to `DeepPick<TextActivity, K>`. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new SaveTextActivityMutation("your-token").saveTextActivity({ id: 1, text: "Hello, world!" });
     * ```
     */
    async saveTextActivity(
        variables: SaveTextActivityVariables,
        options?: RequestOptions & { fields?: undefined }
    ): Promise<Activity>;
    async saveTextActivity(
        variables: SaveTextActivityVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<Activity>;
    async saveTextActivity<K extends FieldPath<TextActivity>>(
        variables: SaveTextActivityVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<TextActivity, K>>;
    async saveTextActivity(
        variables: SaveTextActivityVariables,
        options?: RequestOptions & FieldsSelection<TextActivity>
    ): FieldsResult<Activity> {
        const mutation = `
      mutation ($id: Int, $text: String, $locked: Boolean, $asHtml: Boolean) {
        SaveTextActivity(id: $id, text: $text, locked:$locked) {
          ${TextActivitySchema}
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<Activity>(composeDocument(mutation, fields, []), variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["id", "text"],
                    message: "The SaveTextActivity mutation requires an id or a text variable.",
                },
            ],
            mappings: SaveTextActivityMappings,
            requiresAuth: true,
            transportOptions,
        });
    }
}
