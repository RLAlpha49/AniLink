import { APIWrapper } from "../../../base/APIWrapper";
import { requireVariables, validateVariables } from "../../../base/ValidateVariables";
import { type Activity } from "../interfaces/Activity";
import { MessageActivitySchema } from "../schemas/Activity";

/**
 * `SaveMessageActivityMutation` is an interface representing the variables to save a message activity.
 * It includes the activity id, message, recipient id, private, locked, asMod, and asHtml.
 * @see https://docs.anilist.co/reference/mutation
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
 * `SaveMessageActivityMutation` is a class representing a mutation to save a message activity.
 * It includes a method to save a message activity
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class SaveMessageActivityMutation extends APIWrapper {
    /**
     * `saveMessageActivity` is a method that sends a mutation request to save a message activity.
     *
     * @param variables - An object of type `SaveMessageActivityVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/union/activityunion
     */
    async saveMessageActivity(variables: SaveMessageActivityVariables): Promise<Activity> {
        requireVariables(
            variables,
            { kind: "any", names: ["id", "message"] },
            "The SaveMessageActivity mutation requires an id or a message variable."
        );
        const variableTypeMappings = {
            id: "number",
            message: "string",
            recipientId: "number",
            private: "boolean",
            locked: "boolean",
            asMod: "boolean",
            asHtml: "boolean",
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($id: Int, $message: String, $recipientId: Int, $private: Boolean, $locked: Boolean, $asMod: Boolean, $asHtml: Boolean) {
        SaveMessageActivity(id: $id, message: $message, recipientId: $recipientId, private: $private, locked:$locked, asMod: $asMod) {
          ${MessageActivitySchema}
        }
      }
    `;

        return await this.request(mutation, variables, true);
    }
}
