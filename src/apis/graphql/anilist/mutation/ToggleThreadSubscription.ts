import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ThreadResponse } from "../interfaces/responses/query/Thread";
import { ThreadSchema } from "../schemas/responses/query/Thread";

/**
 * {@link ToggleThreadSubscriptionVariables} contains variables for the {@link ToggleThreadSubscriptionMutation} operation.
 *
 * See {@link ToggleThreadSubscriptionMutation} and {@link ThreadResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/thread
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
 * Validation metadata maps {@link ToggleThreadSubscriptionVariables} to runtime types for the
 * `toggleThreadSubscription` operation.
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
 * {@link ToggleThreadSubscriptionMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link ToggleThreadSubscriptionMutation.toggleThreadSubscription}; variables use
 * {@link ToggleThreadSubscriptionVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/thread
 */
export class ToggleThreadSubscriptionMutation extends AniListOperation {
    /**
     * {@link ToggleThreadSubscriptionMutation.toggleThreadSubscription} sends a mutation request to subscribe to a thread.
     *
     * @param variables - Values from {@link ToggleThreadSubscriptionVariables} for the mutation.
     * @returns The {@link ThreadResponse} returned by the mutation.
     * @throws Throws if no authentication token is configured, `threadId` or `subscribe` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/thread
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ToggleThreadSubscriptionMutation("your-token").toggleThreadSubscription({ threadId: 1, subscribe: true });
     * ```
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
