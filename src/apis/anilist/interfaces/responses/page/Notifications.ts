import { type NotificationResponse } from "../query/Notification";
import { type PageInfo } from "./PageInfo";

/**
 * `NotificationsPageResponse` is the paginated response from a notifications query.
 */
export interface NotificationsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Notifications returned for the requested page. */
    notifications: NotificationResponse[];
}
