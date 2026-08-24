import { APIWrapper } from "../../../base/APIWrapper";
import { type ActivityReply } from "../interfaces/Activity";
import { ActivityReplySchema } from "../schemas/Activity";

/**
 * `SaveActivityReplyMutation` is an interface representing the variables to save an activity reply.
 * It includes the id of the activity, the activity id, the text of the activity reply, the locked status of the activity reply, and the status of the activity reply.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface SaveActivityReplyVariables {
    /**
     * `id` is a number representing the id of the activity reply.
     */
    id: number;

    /**
     * `activityId` is a number representing the id of the activity.
     */
    activityId?: number;

    /**
     * `text` is a string representing the text of the activity reply.
     */
    text: string;

    /**
     * `asMod` is a boolean representing the locked status of the activity reply.
     */
    asMod?: boolean;

    /**
     * `asHtml` is a boolean representing the status of the activity reply.
     */
    asHtml?: boolean;
}

/**
 * `SaveActivityReplyMutation` is a class representing a mutation to save an activity reply.
 * It includes a method to save an activity reply
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export class SaveActivityReplyMutation extends APIWrapper {
    /**
     * `SaveActivityReply` is a method that sends a mutation request to save an activity reply.
     *
     * @param variables - An object of type `SaveActivityReplyVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the response from the mutation request.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     *   * @see https://docs.anilist.co/reference/object/activityreply
     */
    async saveActivityReply(variables: SaveActivityReplyVariables): Promise<ActivityReply> {
        const mutation = `
      mutation ($id: Int, $activityId: Int, $text: String, $asMod: Boolean, $asHtml: Boolean) {
        SaveActivityReply (id: $id, activityId: $activityId, text: $text, asMod: $asMod) {
          ${ActivityReplySchema}
        }
      }
    `;
        return await this.execute<ActivityReply>(mutation, variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["id", "text"],
                    message: "The SaveActivityReply mutation requires an id or a text variable.",
                },
            ],
            mappings: {
                id: "number",
                activityId: "number",
                text: "string",
                asMod: "boolean",
                asHtml: "boolean",
            },
            requiresAuth: true,
        });
    }
}
