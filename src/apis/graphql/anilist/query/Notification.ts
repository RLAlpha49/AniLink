import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type NotificationResponse } from "../interfaces/responses/query/Notification";
import { type NotificationType, NotificationTypeMappings } from "../types/Type";
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
 * The variable type mappings for the `notification` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const NotificationMappings = {
    type: NotificationTypeMappings,
    resetNotificationCount: "boolean",
    type_in: NotificationTypeMappings,
    asHtml: "boolean",
};

/**
 * `NotificationQuery` is a class representing a query for notification data.
 * It includes a method to send the notification query and receive the response.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export class NotificationQuery extends AniListOperation {
    /**
     * `notification` is a method that sends a query request to get notification data.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/union/notificationunion
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async notification(
        variables: NotificationVariables,
        options?: RequestOptions
    ): Promise<NotificationResponse> {
        const query = `
      query ($type: NotificationType, $resetNotificationCount: Boolean, $type_in: [NotificationType], $asHtml: Boolean) {
        Notification (type: $type, resetNotificationCount: $resetNotificationCount, type_in: $type_in) {
          ${NotificationSchema}
        }
      }
    `;
        return await this.execute<NotificationResponse>(query, variables, {
            mappings: NotificationMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
