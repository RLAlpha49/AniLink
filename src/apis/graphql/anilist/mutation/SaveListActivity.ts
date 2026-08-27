import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type Activity } from "../interfaces/Activity";
import { ListActivitySchema } from "../schemas/Activity";

/**
 * {@link SaveListActivityVariables} contains variables for the {@link SaveListActivityMutation} operation.
 *
 * See the {@link SaveListActivityMutation} operation and {@link Activity} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/union/activityunion
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
 * Validation metadata maps {@link SaveListActivityVariables} to runtime types for the
 * `saveListActivity` operation.
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
 * {@link SaveListActivityMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link SaveListActivityMutation.saveListActivity}; variables use
 * {@link SaveListActivityVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class SaveListActivityMutation extends AniListOperation {
    /**
     * {@link SaveListActivityMutation.saveListActivity} sends a mutation request to save a list activity.
     *
     * @param variables - Values from {@link SaveListActivityVariables} for the mutation.
     * @returns The {@link Activity} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/union/activityunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new SaveListActivityMutation("your-token").saveListActivity({ id: 1 });
     * ```
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
