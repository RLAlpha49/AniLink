import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type Activity } from "../interfaces/Activity";
import { MessageActivitySchema } from "../schemas/Activity";

/**
 * {@link SaveMessageActivityVariables} contains variables for the {@link SaveMessageActivityMutation} operation.
 *
 * See the {@link SaveMessageActivityMutation} operation and {@link Activity} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export interface SaveMessageActivityVariables {
    /**
     * `id` is a number representing the id of the activity.
     */
    id: number;

    /**
     * `message` is a string representing the message.
     */
    message?: string;

    /**
     * `recipientId` is a number representing the id of the recipient.
     */
    recipientId?: number;

    /**
     * `private` is a boolean representing whether the message is private.
     */
    private?: boolean;

    /**
     * `locked` is a boolean representing whether the message is locked.
     */
    locked?: boolean;

    /**
     * `asMod` is a boolean representing whether the activity is saved as a moderator.
     */
    asMod?: boolean;

    /**
     * `asHtml` is a boolean representing whether the description in the return response is in HTML format.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps {@link SaveMessageActivityVariables} to runtime types for the
 * `saveMessageActivity` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const SaveMessageActivityMappings = {
    id: "number",
    message: "string",
    recipientId: "number",
    private: "boolean",
    locked: "boolean",
    asMod: "boolean",
    asHtml: "boolean",
};

/**
 * {@link SaveMessageActivityMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link SaveMessageActivityMutation.saveMessageActivity}; variables use
 * {@link SaveMessageActivityVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class SaveMessageActivityMutation extends AniListOperation {
    /**
     * {@link SaveMessageActivityMutation.saveMessageActivity} sends a mutation request to save a message activity.
     *
     * @param variables - Values from {@link SaveMessageActivityVariables} for the mutation.
     * @returns The {@link Activity} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` or `message` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/union/activityunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new SaveMessageActivityMutation("your-token").saveMessageActivity({ id: 1, message: "Hello, world!" });
     * ```
     */
    async saveMessageActivity(
        variables: SaveMessageActivityVariables,
        options?: RequestOptions
    ): Promise<Activity> {
        const mutation = `
      mutation ($id: Int, $message: String, $recipientId: Int, $private: Boolean, $locked: Boolean, $asMod: Boolean, $asHtml: Boolean) {
        SaveMessageActivity(id: $id, message: $message, recipientId: $recipientId, private: $private, locked:$locked, asMod: $asMod) {
          ${MessageActivitySchema}
        }
      }
    `;
        return await this.execute<Activity>(mutation, variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["id", "message"],
                    message:
                        "The SaveMessageActivity mutation requires an id or a message variable.",
                },
            ],
            mappings: SaveMessageActivityMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
