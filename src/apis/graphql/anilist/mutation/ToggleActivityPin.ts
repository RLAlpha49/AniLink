import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type Activity } from "../interfaces/Activity";
import { ActivityWithRepliesSchema } from "../schemas/Activity";

/**
 * {@link ToggleActivityPinVariables} contains variables for the {@link ToggleActivityPinMutation} operation.
 *
 * See the {@link ToggleActivityPinMutation} operation and {@link Activity} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/union/activityunion
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
 * Validation metadata maps {@link ToggleActivityPinVariables} to runtime types for the
 * `toggleActivityPin` operation.
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
 * {@link ToggleActivityPinMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link ToggleActivityPinMutation.toggleActivityPin}; variables use
 * {@link ToggleActivityPinVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class ToggleActivityPinMutation extends AniListOperation {
    /**
     * {@link ToggleActivityPinMutation.toggleActivityPin} sends a mutation request to pin an activity.
     *
     * @param variables - Values from {@link ToggleActivityPinVariables} for the mutation.
     * @returns The {@link Activity} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` or `pinned` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/union/activityunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ToggleActivityPinMutation("your-token").toggleActivityPin({ id: 1, pinned: true });
     * ```
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
