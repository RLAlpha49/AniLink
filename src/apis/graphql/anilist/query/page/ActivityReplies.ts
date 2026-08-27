import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";
import { type ActivityRepliesPageResponse } from "../../interfaces/responses/page/ActivityReplies";
import { ActivityReplySchema } from "../../schemas/Activity";

/**
 * {@link ActivityRepliesVariables} contains variables for the {@link ActivityRepliesQuery} operation.
 *
 * See {@link ActivityRepliesQuery} and {@link ActivityRepliesPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/activityreply
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
 * Validation metadata maps variables to runtime types for the `activityReplies` operation.
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
 * {@link ActivityRepliesQuery} executes the paginated AniList activity-replies query through {@link AniListOperation}.
 * Its public operation is {@link ActivityRepliesQuery.activityReplies}.
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export class ActivityRepliesQuery extends AniListOperation {
    /**
     * `activityReplies` is a method that sends a query request to get activity replies.
     *
     * @param variables - Values from {@link ActivityRepliesVariables} for the query.
     * @returns The {@link ActivityRepliesPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/object/activityreply
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ActivityRepliesQuery().activityReplies({ page: 1, perPage: 10 });
     * ```
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
