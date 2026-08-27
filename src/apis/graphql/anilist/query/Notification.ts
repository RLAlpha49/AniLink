import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type NotificationResponse } from "../interfaces/responses/query/Notification";
import { type NotificationType, NotificationTypeMappings } from "../types/Type";
import { NotificationSchema } from "../schemas/responses/query/Notification";

/**
 * {@link NotificationVariables} contains variables for the {@link NotificationQuery} operation.
 *
 * See {@link NotificationQuery} and {@link NotificationResponse} for the operation and response shape.
 *
 * Values are validated with `NotificationMappings` before dispatch.
 *
 * @see https://docs.anilist.co/reference/union/notificationunion
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
 * Validation metadata maps variables to runtime types for the {@link NotificationQuery.notification} operation.
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
 * {@link NotificationQuery} executes the authenticated AniList notification query through {@link AniListOperation}.
 * Its public operation is {@link NotificationQuery.notification}.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export class NotificationQuery extends AniListOperation {
    /**
     * {@link NotificationQuery.notification} sends a query request to get notification data.
     *
     * @param variables - Values from {@link NotificationVariables} for the query.
     * @returns The {@link NotificationResponse} returned by the query.
     * @see https://docs.anilist.co/reference/union/notificationunion
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new NotificationQuery("authToken").notification({});
     * ```
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
