import { APIWrapper } from "../../../base/APIWrapper";
import { type ActivityReply } from "../interfaces/Activity";
import { ActivityReplySchema } from "../schemas/Activity";

/**
 * `ActivityReplyVariables` is an interface representing the variables for the `ActivityReplyQuery`.
 * At least one of `id` or `activityId` is required by the AniList API; `asHtml` is optional.
 * @see https://docs.anilist.co/reference/query
 */
export interface ActivityReplyVariables {
    /**
     * `id` is a number representing the id of the activity reply.
     */
    id?: number;

    /**
     * `activityId` is a number representing the id of the activity.
     */
    activityId?: number;

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * `ActivityReplyQuery` is a class representing a query for activity replies.
 * It includes a method to get activity replies.
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export class ActivityReplyQuery extends APIWrapper {
    /**
     * `activityReply` is a method that sends a query request to get activity replies.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/activityreply
     */
    async activityReply(variables: ActivityReplyVariables): Promise<ActivityReply> {
        const query = `
      query ($id: Int, $activityId: Int, $asHtml: Boolean) {
        ActivityReply (id: $id, activityId: $activityId) {
          ${ActivityReplySchema}
        }
      }
    `;
        return await this.execute<ActivityReply>(query, variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["id", "activityId"],
                    message: "The ActivityReply query requires an id or an activityId.",
                },
            ],
            mappings: {
                id: "number",
                activityId: "number",
                asHtml: "boolean",
            },
        });
    }
}
