import { APIWrapper } from "../../../../base/APIWrapper";
import { validateVariables } from "../../../../base/ValidateVariables";
import { type ActivityReply } from "../../interfaces/Activity";
import { ActivityReplySchema } from "../../schemas/Activity";

/**
 * `ActivityRepliesVariables` is an interface representing the variables for the `ActivityRepliesQuery`.
 * It includes optional page, per page, id, activity id, and as html.
 * @see https://docs.anilist.co/reference/query
 */
export interface ActivityRepliesVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

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
 * `ActivityRepliesQuery` is a class representing a query for activity replies.
 * It includes a method to get activity replies.
 * @see https://docs.anilist.co/reference/query
 */
export class ActivityRepliesQuery extends APIWrapper {
    /**
     * `activityReplies` is a method that sends a query request to get activity replies.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/query
     */
    async activityReplies(variables: ActivityRepliesVariables): Promise<ActivityReply> {
        if (!variables.id) {
            throw new Error("The id is required");
        }
        const variableTypeMappings = {
            page: "number",
            perPage: "number",
            id: "number",
            activityId: "number",
            asHtml: "boolean",
        };

        validateVariables(variables, variableTypeMappings);

        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $activityId: Int, $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          activityReplies (id: $id, activityId: $activityId) {
            ${ActivityReplySchema}
          }
        }
      }
    `;

        return await this.request(query, variables);
    }
}
