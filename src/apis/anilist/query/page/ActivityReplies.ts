import { APIWrapper } from "../../../../base/APIWrapper";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ActivityRepliesPageResponse } from "../../interfaces/responses/page/ActivityReplies";
import { ActivityReplySchema } from "../../schemas/Activity";

/**
 * `ActivityRepliesVariables` is an interface representing the variables for the `ActivityRepliesQuery`.
 * Every parameter is optional: without filters AniList returns the latest activity replies.
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
 * The variable type mappings for the `activityReplies` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ActivityRepliesMappings = {
    page: "number",
    perPage: "number",
    id: "number",
    activityId: "number",
    asHtml: "boolean",
};

/**
 * `ActivityRepliesQuery` is a class representing a query for activity replies.
 * It includes a method to get activity replies.
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export class ActivityRepliesQuery extends APIWrapper {
    /**
     * `activityReplies` is a method that sends a query request to get activity replies.
     *
     * @param variables - The variables for the query.
     * @returns The activity replies for the requested page with pagination metadata.
     * @see https://docs.anilist.co/reference/object/activityreply
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async activityReplies(
        variables: ActivityRepliesVariables,
        options?: RequestOptions
    ): Promise<ActivityRepliesPageResponse> {
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
        return await this.execute<ActivityRepliesPageResponse>(query, variables, {
            mappings: ActivityRepliesMappings,
            transportOptions: options,
        });
    }
}
