import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ThreadResponse } from "../interfaces/responses/query/Thread";
import { ThreadSchema } from "../schemas/responses/query/Thread";

/**
 * `ToggleThreadSubscriptionVariables` is an interface representing the variables to subscribe to a thread.
 * It includes threadId and subscribe.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface ToggleThreadSubscriptionVariables {
    /**
     * `threadId` is a number representing the id of the thread.
     */
    threadId: number;

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
 * The variable type mappings for the `toggleThreadSubscription` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ToggleThreadSubscriptionMappings = {
    threadId: "number",
    subscribe: "boolean",
    asHtml: "boolean",
};

/**
 * `ToggleThreadSubscriptionMutation` is a class representing a mutation to subscribe to a thread.
 * It includes a method to subscribe to a thread
 * @see https://docs.anilist.co/reference/object/thread
 */
export class ToggleThreadSubscriptionMutation extends AniListOperation {
    /**
     * `toggleThreadSubscription` is a method that sends a mutation request to subscribe to an activity.
     *
     * @param variables - An object of type `ToggleThreadSubscriptionVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/object/thread
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async toggleThreadSubscription(
        variables: ToggleThreadSubscriptionVariables,
        options?: RequestOptions
    ): Promise<ThreadResponse> {
        const mutation = `
      mutation ($threadId: Int, $subscribe: Boolean, $asHtml: Boolean) {
        ToggleThreadSubscription (threadId: $threadId, subscribe: $subscribe) {
          ${ThreadSchema}
        }
      }
    `;
        return await this.execute<ThreadResponse>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["threadId", "subscribe"],
                    message:
                        "The ToggleThreadSubscription mutation requires threadId and subscribe variables.",
                },
            ],
            mappings: ToggleThreadSubscriptionMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
