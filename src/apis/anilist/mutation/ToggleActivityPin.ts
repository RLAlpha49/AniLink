import { APIWrapper } from "../../../base/APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type Activity } from "../interfaces/Activity";
import { ActivityWithRepliesSchema } from "../schemas/Activity";

/**
 * `ToggleActivityPinMutation` is an interface representing the variables to pin an activity.
 * It includes id and pinned.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface ToggleActivityPinVariables {
    /**
     * `id` is a number representing the id of the activity.
     */
    id: number;

    /**
     * `pinned` is a boolean representing whether the activity is pinned.
     */
    pinned?: boolean;

    /**
     * `asHtml` is a boolean representing whether the activity descriptions is in HTML format.
     */
    asHtml?: boolean;
}

/**
 * The variable type mappings for the `toggleActivityPin` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ToggleActivityPinMappings = {
    id: "number",
    pinned: "boolean",
    asHtml: "boolean",
};

/**
 * `ToggleActivityPinMutation` is a class representing a mutation to pin an activity.
 * It includes a method to pin an activity
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class ToggleActivityPinMutation extends APIWrapper {
    /**
     * `toggleActivityPin` is a method that sends a mutation request to pin an activity.
     *
     * @param variables - An object of type `ToggleActivityPinVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/union/activityunion
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async toggleActivityPin(
        variables: ToggleActivityPinVariables,
        options?: RequestOptions
    ): Promise<Activity> {
        const mutation = `
      mutation ($id: Int, $pinned: Boolean, $asHtml: Boolean) {
        ToggleActivityPin(id: $id, pinned: $pinned) {
          ${ActivityWithRepliesSchema}
        }
      }
    `;
        return await this.execute<Activity>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id", "pinned"],
                    message: "The ToggleActivityPin mutation requires id and pinned variables.",
                },
            ],
            mappings: ToggleActivityPinMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
