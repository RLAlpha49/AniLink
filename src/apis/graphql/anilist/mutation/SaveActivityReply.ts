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
import { type ActivityReply } from "../interfaces/Activity";
import { ActivityReplySchema } from "../schemas/Activity";

/**
 * {@link SaveActivityReplyVariables} contains variables for the {@link SaveActivityReplyMutation} operation.
 *
 * See the {@link SaveActivityReplyMutation} operation and {@link ActivityReply} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export interface SaveActivityReplyVariables {
    /**
     * `id` is a number representing the id of the activity reply.
     */
    id: number;

    /**
     * `activityId` is a number representing the id of the activity.
     */
    activityId?: number;

    /**
     * `text` is a string representing the text of the activity reply.
     */
    text: string;

    /**
     * `asMod` is a boolean representing whether the reply is created as a moderator.
     */
    asMod?: boolean;

    /**
     * `asHtml` is a boolean representing whether the reply text is returned rendered as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps {@link SaveActivityReplyVariables} to runtime types for the
 * `saveActivityReply` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const SaveActivityReplyMappings = {
    id: "number",
    activityId: "number",
    text: "string",
    asMod: "boolean",
    asHtml: "boolean",
};

/**
 * {@link SaveActivityReplyMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link SaveActivityReplyMutation.saveActivityReply}; variables use
 * {@link SaveActivityReplyVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export class SaveActivityReplyMutation extends AniListOperation {
    /**
     * {@link SaveActivityReplyMutation.saveActivityReply} sends a mutation request to save an activity reply.
     *
     * Updates the activity reply named by `id` and returns the saved reply. The upstream
     * mutation also creates a reply from `activityId` when `id` is omitted, but
     * {@link SaveActivityReplyVariables} requires `id`, so the typed surface is update-only.
     *
     * @param variables - Values from {@link SaveActivityReplyVariables} for the mutation.
     * @returns The {@link ActivityReply} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` or `text` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/activityreply
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only. Pass `fields` to request only a subset of the response — the document is composed from the corresponding selections and the return type narrows to `DeepPick<ActivityReply, K>`. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new SaveActivityReplyMutation("your-token").saveActivityReply({ id: 1, text: "Hello, world!" });
     * ```
     */
    async saveActivityReply(
        variables: SaveActivityReplyVariables,
        options?: RequestOptions
    ): Promise<ActivityReply>;
    async saveActivityReply(
        variables: SaveActivityReplyVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<ActivityReply>;
    async saveActivityReply<K extends FieldPath<ActivityReply>>(
        variables: SaveActivityReplyVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<ActivityReply, K>>;
    async saveActivityReply(
        variables: SaveActivityReplyVariables,
        options?: RequestOptions & FieldsSelection<ActivityReply>
    ): FieldsResult<ActivityReply> {
        const mutation = `
      mutation ($id: Int, $activityId: Int, $text: String, $asMod: Boolean, $asHtml: Boolean) {
        SaveActivityReply (id: $id, activityId: $activityId, text: $text, asMod: $asMod) {
          ${ActivityReplySchema}
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<ActivityReply>(composeDocument(mutation, fields, []), variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["id", "text"],
                    message: "The SaveActivityReply mutation requires an id or a text variable.",
                },
            ],
            mappings: SaveActivityReplyMappings,
            requiresAuth: true,
            transportOptions,
        });
    }
}
