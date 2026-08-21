import { APIWrapper } from "../../../../base/APIWrapper";

import { type NotificationsPageResponse } from "../../interfaces/responses/page/Notifications";
import { NotificationTypeMappings } from "../../types/Type";
import { validateVariables } from "../../../../base/ValidateVariables";
import { NotificationSchema } from "../../schemas/responses/query/Notification";

/**
 * `NotificationsVariables` is an interface representing the variables for the `NotificationsQuery`.
 * It includes optional page, per page, type, reset notification count, type in, and as html.
 * @see https://docs.anilist.co/reference/query
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
 * `NotificationsQuery` is a class representing a query for notifications.
 * It includes a method to get notifications.
 * @see https://docs.anilist.co/reference/query
 */
export class NotificationsQuery extends APIWrapper {
    /**
     * `notifications` is a method that sends a query request to get notifications.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/query
     */
    async notifications(variables: NotificationsVariables): Promise<NotificationsPageResponse> {
        if (!variables) {
            throw new Error("At least one variable must be set");
        }
        const variableTypeMappings = {
            page: "number",
            perPage: "number",
            type: NotificationTypeMappings,
            resetNotificationCount: "boolean",
            type_in: NotificationTypeMappings,
            asHtml: "boolean",
        };

        validateVariables(variables, variableTypeMappings);

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

        return await this.request(query, variables);
    }
}
