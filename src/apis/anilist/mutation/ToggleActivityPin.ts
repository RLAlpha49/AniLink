import { APIWrapper } from "../../../base/APIWrapper";
import { requireVariables, validateVariables } from "../../../base/ValidateVariables";
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
     */
    async toggleActivityPin(variables: ToggleActivityPinVariables): Promise<Activity> {
        requireVariables(
            variables,
            { kind: "all", names: ["id", "pinned"] },
            "The ToggleActivityPin mutation requires id and pinned variables."
        );
        const variableTypeMappings = {
            id: "number",
            pinned: "boolean",
            asHtml: "boolean",
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($id: Int, $pinned: Boolean, $asHtml: Boolean) {
        ToggleActivityPin(id: $id, pinned: $pinned) {
          ${ActivityWithRepliesSchema}
        }
      }
    `;

        return await this.request(mutation, variables, true);
    }
}
