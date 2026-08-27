import { type ThreadResponse } from "../interfaces/responses/query/Thread";
import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { ThreadSchema } from "../schemas/responses/query/Thread";

/**
 * {@link SaveThreadVariables} contains variables for the {@link SaveThreadMutation} operation.
 *
 * See the {@link SaveThreadMutation} operation and {@link ThreadResponse} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/thread
 */
export interface SaveThreadVariables {
    /**
     * `id` is the ID of the thread.
     */
    id: number;

    /**
     * `title` is the title of the thread.
     */
    title: string;

    /**
     * `body` is the body of the thread.
     */
    body: string;

    /**
     * `categories` is an array of category IDs that the thread belongs to.
     */
    categories: number[];

    /**
     * `mediaCategories` is an array of media category IDs that the thread belongs to.
     */
    mediaCategories: number[];

    /**
     * `sticky` is a boolean that determines if the thread is sticky.
     */
    sticky: boolean;

    /**
     * `locked` is a boolean that determines if the thread is locked.
     */
    locked: boolean;

    /**
     * `asHtml` is a boolean that determines if the response is in HTML format.
     */
    asHtml: boolean;
}

/**
 * Validation metadata maps {@link SaveThreadVariables} to runtime types for the
 * `saveThread` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const SaveThreadMappings = {
    id: "number",
    title: "string",
    body: "string",
    categories: "number[]",
    mediaCategories: "number[]",
    sticky: "boolean",
    locked: "boolean",
    asHtml: "boolean",
};

/**
 * {@link SaveThreadMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link SaveThreadMutation.saveThread}; variables use
 * {@link SaveThreadVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/thread
 */
export class SaveThreadMutation extends AniListOperation {
    /**
     * {@link SaveThreadMutation.saveThread} sends a mutation request to save a thread.
     *
     * @param variables - Values from {@link SaveThreadVariables} for the mutation.
     * @returns The {@link ThreadResponse} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` or `title` is missing, a variable has an invalid type, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/thread
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new SaveThreadMutation("your-token").saveThread({ id: 1, title: "Example thread", body: "Hello, world!", categories: [], mediaCategories: [], sticky: false, locked: false, asHtml: true });
     * ```
     */
    async saveThread(
        variables: SaveThreadVariables,
        options?: RequestOptions
    ): Promise<ThreadResponse> {
        const mutation = `
      mutation ($id: Int, $title: String, $body: String, $categories: [Int], $mediaCategories: [Int], $sticky: Boolean, $locked: Boolean, $asHtml: Boolean) {
        SaveThread (id: $id, title: $title, body: $body, categories: $categories, mediaCategories: $mediaCategories, sticky: $sticky, locked: $locked) {
          ${ThreadSchema}
        }
      }
    `;
        return await this.execute<ThreadResponse>(mutation, variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["id", "title"],
                    message: "The SaveThread mutation requires an id or a title variable.",
                },
            ],
            mappings: SaveThreadMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
