import { AniListOperation } from "../../AniListOperation";
import { composeDocument } from "../../schemas/selection/composeSelection";
import { PAGE_ALWAYS, splitFieldsOption } from "../../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../../schemas/selection/fieldsSelection";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type NotificationsPageResponse } from "../../interfaces/responses/page/Notifications";
import { NotificationTypeMappings } from "../../types/Type";
import { NotificationSchema } from "../../schemas/responses/query/Notification";

/**
 * {@link NotificationsVariables} contains variables for the {@link NotificationsQuery} operation.
 *
 * See {@link NotificationsQuery} and {@link NotificationsPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface NotificationsVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

    /**
     * `type` is a string representing the type of the notification; a `NotificationType` value.
     */
    type?: string;

    /**
     * `resetNotificationCount` is a boolean that resets the unread notification count to 0.
     */
    resetNotificationCount?: boolean;

    /**
     * `type_in` is an array of strings representing the types of notifications to include; `NotificationType` values.
     */
    type_in?: string[];

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the `notifications` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const NotificationsMappings = {
    page: "number",
    perPage: "number",
    type: NotificationTypeMappings,
    resetNotificationCount: "boolean",
    type_in: NotificationTypeMappings,
    asHtml: "boolean",
};

/**
 * {@link NotificationsQuery} executes the paginated AniList notifications query through {@link AniListOperation}.
 * Its public operation is {@link NotificationsQuery.notifications}.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export class NotificationsQuery extends AniListOperation {
    /**
     * {@link NotificationsQuery.notifications} sends a query request to get a page of the authenticated
     * user's notifications. Requires an auth token.
     *
     * @param variables - Values from {@link NotificationsVariables} for the query; `page` and `perPage`
     * select the slice of results.
     * @returns The {@link NotificationsPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/union/notificationunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @throws Throws if no authentication token is configured (the feed is always the authenticated user's own) or the request fails.
     * @example
     * ```typescript
     * const result = await new NotificationsQuery().notifications({ page: 1, perPage: 10 });
     * ```
     */
    async notifications(
        variables: NotificationsVariables,
        options?: RequestOptions & { fields?: undefined }
    ): Promise<NotificationsPageResponse>;
    async notifications(
        variables: NotificationsVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<NotificationsPageResponse>;
    async notifications<K extends FieldPath<NotificationsPageResponse>>(
        variables: NotificationsVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<NotificationsPageResponse, K | "pageInfo">>;
    async notifications(
        variables: NotificationsVariables,
        options?: RequestOptions & FieldsSelection<NotificationsPageResponse>
    ): FieldsResult<NotificationsPageResponse, "pageInfo"> {
        const query = `
      query ($page: Int, $perPage: Int, $type: NotificationType, $resetNotificationCount: Boolean, $type_in: [NotificationType], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          notifications (type: $type, resetNotificationCount: $resetNotificationCount, type_in: $type_in) {
            ${NotificationSchema}
          }
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<NotificationsPageResponse>(
            composeDocument(query, fields, PAGE_ALWAYS),
            variables,
            {
                mappings: NotificationsMappings,
                requiresAuth: true,
                transportOptions,
            }
        );
    }
}
