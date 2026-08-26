import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type Activity } from "../interfaces/Activity";
import { ActivityWithRepliesSchema } from "../schemas/Activity";

/**
 * `ToggleActivitySubscriptionMutation` is an interface representing the variables to pin an activity.
 * It includes activityId and subscribe.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface ToggleActivitySubscriptionVariables {
    /**
     * `activityId` is a number representing the id of the activity.
     */
    activityId: number;

    /**
     * `subscribe` is a boolean representing whether the activity is subscribed.
     */
    subscribe: boolean;

    /**
     * `asHtml` is a boolean representing whether the activity descriptions is in HTML format.
     */
    asHtml?: boolean;
}

/**
 * The variable type mappings for the `toggleActivitySubscription` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ToggleActivitySubscriptionMappings = {
    activityId: "number",
    subscribe: "boolean",
    asHtml: "boolean",
};

/**
 * `ToggleActivitySubscriptionMutation` is a class representing a mutation to subscribe to an activity.
 * It includes a method to subscribe to an activity
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class ToggleActivitySubscriptionMutation extends AniListOperation {
    /**
     * `toggleActivitySubscription` is a method that sends a mutation request to subscribe to an activity.
     *
     * @param variables - An object of type `ToggleActivitySubscriptionVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/union/activityunion
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async toggleActivitySubscription(
        variables: ToggleActivitySubscriptionVariables,
        options?: RequestOptions
    ): Promise<Activity> {
        const mutation = `
      mutation ($activityId: Int, $subscribe: Boolean, $asHtml: Boolean) {
        ToggleActivitySubscription(activityId: $activityId, subscribe: $subscribe) {
          ${ActivityWithRepliesSchema}
        }
      }
    `;
        return await this.execute<Activity>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["activityId", "subscribe"],
                    message:
                        "The ToggleActivitySubscription mutation requires activityId and subscribe variables.",
                },
            ],
            mappings: ToggleActivitySubscriptionMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
