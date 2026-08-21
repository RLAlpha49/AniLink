import { type ThreadResponse } from "../interfaces/responses/query/Thread";
import { validateVariables } from "../../../base/ValidateVariables";
import { APIWrapper } from "../../../base/APIWrapper";
import { ThreadSchema } from "../schemas/responses/query/Thread";

/**
 * `SaveThreadVariables` is an interface that contains the variables that are passed to the `SaveThread` mutation.
 * It includes the ID, title, body, categories, mediaCategories, sticky, locked, and asHtml variables.
 * @see https://docs.anilist.co/reference/mutation
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
 * `SaveThreadMutation` is a class representing a mutation to save a thread.
 * It includes a method to save a thread
 * @see https://docs.anilist.co/reference/mutation
 */
export class SaveThreadMutation extends APIWrapper {
    /**
     * `SaveThread` is a method that sends a mutation request to save a thread.
     *
     * @param variables - An object of type `SaveThreadVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/mutation
     */
    async saveThread(variables: SaveThreadVariables): Promise<ThreadResponse> {
        if (!variables.id && !variables.title) {
            throw new Error("id or title variable is required");
        }
        const variableTypeMappings = {
            id: "number",
            title: "string",
            body: "string",
            categories: "number[]",
            mediaCategories: "number[]",
            sticky: "boolean",
            locked: "boolean",
            asHtml: "boolean",
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($id: Int, $title: String, $body: String, $categories: [Int], $mediaCategories: [Int], $sticky: Boolean, $locked: Boolean, $asHtml: Boolean) {
        SaveThread (id: $id, title: $title, body: $body, categories: $categories, mediaCategories: $mediaCategories, sticky: $sticky, locked: $locked) {
          ${ThreadSchema}
        }
      }
    `;

        return await this.request(mutation, variables, true);
    }
}
