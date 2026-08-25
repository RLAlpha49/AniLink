import { APIWrapper } from "../APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type Activity } from "../interfaces/Activity";
import { TextActivitySchema } from "../schemas/Activity";

/**
 * `SaveTextActivityMutation` is an interface representing the variables to save a text activity.
 * It includes the activity id, text, locked status, and HTML output flag.
 * @see https://docs.anilist.co/reference/mutation
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
 * The variable type mappings for the `saveTextActivity` operation.
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
 * `SaveTextActivityMutation` is a class representing a mutation to save a text activity.
 * It includes a method to save a text activity
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class SaveTextActivityMutation extends APIWrapper {
    /**
     * `saveTextActivity` is a method that sends a mutation request to save a text activity.
     *
     * @param variables - An object of type `SaveTextActivityVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/union/activityunion
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async saveTextActivity(
        variables: SaveTextActivityVariables,
        options?: RequestOptions
    ): Promise<Activity> {
        const mutation = `
      mutation ($id: Int, $text: String, $locked: Boolean, $asHtml: Boolean) {
        SaveTextActivity(id: $id, text: $text, locked:$locked) {
          ${TextActivitySchema}
        }
      }
    `;
        return await this.execute<Activity>(mutation, variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["id", "text"],
                    message: "The SaveTextActivity mutation requires an id or a text variable.",
                },
            ],
            mappings: SaveTextActivityMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
