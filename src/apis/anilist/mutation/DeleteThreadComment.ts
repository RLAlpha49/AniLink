import { APIWrapper } from "../../../base/APIWrapper";
import { sendRequest } from "../../../base/RequestHandler";
import { validateVariables } from "../../../base/ValidateVariables";

/**
 * `DeleteThreadCommentVariables` is an interface representing the variables to delete a thread comment.
 * It includes the id of the thread comment.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface DeleteThreadCommentVariables {
    /**
     * `id` is a number representing the id of the activity.
     */
    id: number;
}

/**
 * `DeleteThreadCommentMutation` is a class representing a mutation to delete a thread comment.
 * It includes a method to delete a thread
 * @see https://docs.anilist.co/reference/mutation
 */
export class DeleteThreadCommentMutation extends APIWrapper {
    /**
     * `authToken` is a string representing the authentication token.
     */
    private readonly authToken?: string;

    /**
     * Constructs a new `DeleteThreadCommentMutation` instance.
     *
     * @param authToken - The authentication token.
     */
    constructor(authToken?: string) {
        super("https://graphql.anilist.co");
        this.authToken = authToken;
    }

    /**
     * `deleteThreadComment` is a method that sends a mutation request to delete a thread comment.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the comment was deleted by this
     * call; a `false` value means the comment was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - An object of type `DeleteThreadCommentVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to `{ deleted }`, where `deleted` is `true` when the comment was deleted by this call and `false` when it was already absent.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/mutation
     */
    async deleteThreadComment(variables: DeleteThreadCommentVariables): Promise<any> {
        if (!variables.id) {
            throw new Error("id variable is required");
        }
        const variableTypeMappings = {
            id: "number",
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($id: Int) {
        DeleteThreadComment (id: $id) {
          deleted
        }
      }
    `;

        const data = { query: mutation, variables };
        return await sendRequest(this.baseURL, "POST", data, this.authToken, true);
    }
}
