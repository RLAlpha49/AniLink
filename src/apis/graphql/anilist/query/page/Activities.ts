import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";
import { type ActivitiesPageResponse } from "../../interfaces/responses/page/Activities";
import { ActivityTypeMappings } from "../../types/ActivityType";
import { ActivitySortMappings } from "../../types/Sort";
import { ActivityWithRepliesSchema } from "../../schemas/Activity";

/**
 * {@link ActivitiesVariables} contains variables for the {@link ActivitiesQuery} operation.
 *
 * See {@link ActivitiesQuery} and {@link ActivitiesPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export interface ActivitiesVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

    /**
     * `id` is a number representing the id of the activity.
     */
    id?: number;

    /**
     * `userId` is a number representing the id of the user.
     */
    userId?: number;

    /**
     * `messengerId` is a number representing the id of the messenger.
     */
    messengerId?: number;

    /**
     * `mediaId` is a number representing the id of the media.
     */
    mediaId?: number;

    /**
     * `type` is a string representing the type of the activity.
     */
    type?: string;

    /**
     * `isFollowing` is a boolean representing whether the user is following.
     */
    isFollowing?: boolean;

    /**
     * `hasReplies` is a boolean representing whether the activity has replies.
     */
    hasReplies?: boolean;

    /**
     * `hasRepliesOrTypeText` is a boolean representing whether the activity has replies or type text.
     */
    hasRepliesOrTypeText?: boolean;

    /**
     * `createdAt` is a number representing the creation time of the activity.
     */
    createdAt?: number;

    /**
     * `id_not` is a number representing the id that should not be included.
     */
    id_not?: number;

    /**
     * `id_in` is an array of numbers representing the ids that should be included.
     */
    id_in?: number[];

    /**
     * `id_not_in` is an array of numbers representing the ids that should not be included.
     */
    id_not_in?: number[];

    /**
     * `userId_not` is a number representing the user id that should not be included.
     */
    userId_not?: number;

    /**
     * `userId_in` is an array of numbers representing the user ids that should be included.
     */
    userId_in?: number[];

    /**
     * `userId_not_in` is an array of numbers representing the user ids that should not be included.
     */
    userId_not_in?: number[];

    /**
     * `messengerId_not` is a number representing the messenger id that should not be included.
     */
    messengerId_not?: number;

    /**
     * `messengerId_in` is an array of numbers representing the messenger ids that should be included.
     */
    messengerId_in?: number[];

    /**
     * `messengerId_not_in` is an array of numbers representing the messenger ids that should not be included.
     */
    messengerId_not_in?: number[];

    /**
     * `mediaId_not` is a number representing the media id that should not be included.
     */
    mediaId_not?: number;

    /**
     * `mediaId_in` is an array of numbers representing the media ids that should be included.
     */
    mediaId_in?: number[];

    /**
     * `mediaId_not_in` is an array of numbers representing the media ids that should not be included.
     */
    mediaId_not_in?: number[];

    /**
     * `type_not` is a string representing the type that should not be included.
     */
    type_not?: string;

    /**
     * `type_in` is an array of strings representing the types that should be included.
     */
    type_in?: string[];

    /**
     * `type_not_in` is an array of strings representing the types that should not be included.
     */
    type_not_in?: string[];

    /**
     * `createdAt_greater` is a number representing the minimum creation time.
     */
    createdAt_greater?: number;

    /**
     * `sort` is an array of strings representing the sort order.
     */
    sort?: string[];

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the `activities` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ActivitiesMappings = {
    page: "number",
    perPage: "number",
    id: "number",
    userId: "number",
    messengerId: "number",
    mediaId: "number",
    type: ActivityTypeMappings,
    isFollowing: "boolean",
    hasReplies: "boolean",
    hasRepliesOrTypeText: "boolean",
    createdAt: "number",
    id_not: "number",
    id_in: "number[]",
    id_not_in: "number[]",
    userId_not: "number",
    userId_in: "number[]",
    userId_not_in: "number[]",
    messengerId_not: "number",
    messengerId_in: "number[]",
    messengerId_not_in: "number[]",
    mediaId_not: "number",
    mediaId_in: "number[]",
    mediaId_not_in: "number[]",
    type_not: ActivityTypeMappings,
    type_in: ActivityTypeMappings,
    type_not_in: ActivityTypeMappings,
    createdAt_greater: "number",
    sort: ActivitySortMappings,
    asHtml: "boolean",
};

/**
 * {@link ActivitiesQuery} executes the paginated AniList activities query through {@link AniListOperation}.
 * Its public operation is {@link ActivitiesQuery.activities}.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export class ActivitiesQuery extends AniListOperation {
    /**
     * `activities` is a method that sends a query request to get activities.
     *
     * @param variables - Values from {@link ActivitiesVariables} for the query.
     * @returns The {@link ActivitiesPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/union/activityunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ActivitiesQuery().activities({ page: 1, perPage: 10 });
     * ```
     */
    async activities(
        variables: ActivitiesVariables,
        options?: RequestOptions
    ): Promise<ActivitiesPageResponse> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $userId: Int, $messengerId: Int, $mediaId: Int, $type: ActivityType, $isFollowing: Boolean, $hasReplies: Boolean, $hasRepliesOrTypeText: Boolean, $createdAt: Int, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $userId_not: Int, $userId_in: [Int], $userId_not_in: [Int], $messengerId_not: Int, $messengerId_in: [Int], $messengerId_not_in: [Int], $mediaId_not: Int, $mediaId_in: [Int], $mediaId_not_in: [Int], $type_not: ActivityType, $type_in: [ActivityType], $type_not_in: [ActivityType], $createdAt_greater: Int, $sort: [ActivitySort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          activities (id: $id, userId: $userId, messengerId: $messengerId, mediaId: $mediaId, type: $type, isFollowing: $isFollowing, hasReplies: $hasReplies, hasRepliesOrTypeText: $hasRepliesOrTypeText, createdAt: $createdAt, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, userId_not: $userId_not, userId_in: $userId_in, userId_not_in: $userId_not_in, messengerId_not: $messengerId_not, messengerId_in: $messengerId_in, messengerId_not_in: $messengerId_not_in, mediaId_not: $mediaId_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, type_not: $type_not, type_in: $type_in, type_not_in: $type_not_in, createdAt_greater: $createdAt_greater, sort: $sort) {
            ${ActivityWithRepliesSchema}
          }
        }
      }
    `;
        return await this.execute<ActivitiesPageResponse>(query, variables, {
            mappings: ActivitiesMappings,
            transportOptions: options,
        });
    }
}
