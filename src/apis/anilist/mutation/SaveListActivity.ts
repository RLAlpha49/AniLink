import { APIWrapper } from "../../../base/APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type Activity } from "../interfaces/Activity";
import { ListActivitySchema } from "../schemas/Activity";

/**
 * `SaveListActivityMutation` is an interface representing the variables to save a list activity.
 * It includes the `customList` and `type` variables of the list activity to save.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface SaveListActivityVariables {
    /**
     * `id` is a number representing the id of the list activity.
     */
    id: number;

    /**
     * `locked` is a boolean representing whether the list activity is locked.
     */
    locked?: boolean;

    /**
     * `asHtml` is a boolean representing whether the list activity is in HTML format.
     */
    asHtml?: boolean;
}

/**
 * The variable type mappings for the `saveListActivity` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const SaveListActivityMappings = {
    id: "number",
    locked: "boolean",
    asHtml: "boolean",
};

/**
 * `SaveListActivityMutation` is a class representing a mutation to save a list activity.
 * It includes a method to save a list activity
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class SaveListActivityMutation extends APIWrapper {
    /**
     * `saveListActivity` is a method that sends a mutation request to save a list activity.
     *
     * @param variables - An object of type `SaveListActivityVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/union/activityunion
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async saveListActivity(
        variables: SaveListActivityVariables,
        options?: RequestOptions
    ): Promise<Activity> {
        const mutation = `
      mutation ($id: Int, $locked: Boolean, $asHtml: Boolean) {
        SaveListActivity(id: $id, locked:$locked)
          ${ListActivitySchema}
      }
    `;
        return await this.execute<Activity>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id"],
                    message: "The SaveListActivity mutation requires an id variable.",
                },
            ],
            mappings: SaveListActivityMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
