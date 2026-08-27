import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ActivityReply } from "../interfaces/Activity";
import { ActivityReplySchema } from "../schemas/Activity";

/**
 * {@link ActivityReplyVariables} contains variables for the {@link ActivityReplyQuery} operation.
 *
 * See {@link ActivityReplyQuery} and {@link ActivityReply} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/activityreply
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
 * The variable type mappings for the {@link ActivityReplyQuery.activityReply} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ActivityReplyMappings = {
    id: "number",
    activityId: "number",
    asHtml: "boolean",
};

/**
 * {@link ActivityReplyQuery} executes the AniList activity-reply query through {@link AniListOperation}.
 * Its public operation is {@link ActivityReplyQuery.activityReply}.
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export class ActivityReplyQuery extends AniListOperation {
    /**
     * {@link ActivityReplyQuery.activityReply} sends a query request to get activity replies.
     *
     * @param variables - Values from {@link ActivityReplyVariables} for the query.
     * @returns The {@link ActivityReply} returned by the query.
     * @see https://docs.anilist.co/reference/object/activityreply
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ActivityReplyQuery().activityReply({ activityId: 1 });
     * ```
     */
    async activityReply(
        variables: ActivityReplyVariables,
        options?: RequestOptions
    ): Promise<ActivityReply> {
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
            mappings: ActivityReplyMappings,
            transportOptions: options,
        });
    }
}
