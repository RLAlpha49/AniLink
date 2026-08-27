import { AniListOperation } from "../../AniListOperation";
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
     * `type` is a string representing the type of the notification.
     */
    type?: string;

    /**
     * `resetNotificationCount` is a boolean representing whether to reset the notification count.
     */
    resetNotificationCount?: boolean;

    /**
     * `type_in` is an array of strings representing the types of notifications that should be included.
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
     * `notifications` is a method that sends a query request to get notifications.
     *
     * @param variables - Values from {@link NotificationsVariables} for the query.
     * @returns The {@link NotificationsPageResponse} returned by the query.
     * @see https://docs.anilist.co/reference/union/notificationunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new NotificationsQuery().notifications({ page: 1, perPage: 10 });
     * ```
     */
    async notifications(
        variables: NotificationsVariables,
        options?: RequestOptions
    ): Promise<NotificationsPageResponse> {
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
        return await this.execute<NotificationsPageResponse>(query, variables, {
            mappings: NotificationsMappings,
            transportOptions: options,
        });
    }
}
