import { APIWrapper } from "../../../base/APIWrapper";
import { type NotificationResponse } from "../interfaces/responses/query/Notification";
import { type NotificationType, NotificationTypeMappings } from "../types/Type";
import { validateVariables } from "../../../base/ValidateVariables";
import { NotificationSchema } from "../schemas/responses/query/Notification";

/**
 * `NotificationVariables` is an interface representing the variables for the `NotificationQuery`.
 * It includes optional parameters for querying notification data.
 * @see https://docs.anilist.co/reference/query
 */
export interface NotificationVariables {
    /**
     * `type` is a string representing the type of the notification.
     */
    type?: NotificationType;

    /**
     * `resetNotificationCount` is a boolean indicating whether to reset the notification count.
     */
    resetNotificationCount?: boolean;

    /**
     * `type_in` is an array of strings representing the types of the notifications.
     */
    type_in?: NotificationType[];

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * `NotificationQuery` is a class representing a query for notification data.
 * It includes a method to send the notification query and receive the response.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export class NotificationQuery extends APIWrapper {
    /**
     * `notification` is a method that sends a query request to get notification data.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/union/notificationunion
     */
    async notification(variables: NotificationVariables): Promise<NotificationResponse> {
        const variableTypeMappings = {
            type: NotificationTypeMappings,
            resetNotificationCount: "boolean",
            type_in: NotificationTypeMappings,
            asHtml: "boolean",
        };

        validateVariables(variables, variableTypeMappings);

        const query = `
      query ($type: NotificationType, $resetNotificationCount: Boolean, $type_in: [NotificationType], $asHtml: Boolean) {
        Notification (type: $type, resetNotificationCount: $resetNotificationCount, type_in: $type_in) {
          ${NotificationSchema}
        }
      }
    `;

        return await this.request(query, variables, true);
    }
}
