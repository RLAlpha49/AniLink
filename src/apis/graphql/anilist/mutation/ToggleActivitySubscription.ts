import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type Activity } from "../interfaces/Activity";
import { ActivityWithRepliesSchema } from "../schemas/Activity";

/**
 * {@link ToggleActivitySubscriptionVariables} contains variables for the {@link ToggleActivitySubscriptionMutation} operation.
 *
 * See the {@link ToggleActivitySubscriptionMutation} operation and {@link Activity} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/union/activityunion
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
 * Validation metadata maps {@link ToggleActivitySubscriptionVariables} to runtime types for the
 * `toggleActivitySubscription` operation.
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
 * {@link ToggleActivitySubscriptionMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link ToggleActivitySubscriptionMutation.toggleActivitySubscription}; variables use
 * {@link ToggleActivitySubscriptionVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class ToggleActivitySubscriptionMutation extends AniListOperation {
    /**
     * {@link ToggleActivitySubscriptionMutation.toggleActivitySubscription} sends a mutation request to subscribe to an activity.
     *
     * @param variables - Values from {@link ToggleActivitySubscriptionVariables} for the mutation.
     * @returns The {@link Activity} returned by the mutation.
     * @throws Throws if no authentication token is configured, `activityId` or `subscribe` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/union/activityunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ToggleActivitySubscriptionMutation("your-token").toggleActivitySubscription({ activityId: 1, subscribe: true });
     * ```
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
