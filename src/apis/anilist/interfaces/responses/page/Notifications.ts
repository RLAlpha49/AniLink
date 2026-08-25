/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type NotificationResponse } from "../query/Notification";
import { type PageInfo } from "./PageInfo";
/**
 * `NotificationsPageResponse` — a page of notifications with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export interface NotificationsPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `notifications` is a list of `NotificationResponse` entries representing the notifications.
     */
    notifications: NotificationResponse[];
}

// @generated-end
