import { type ActivityNotification } from "../../Activity";
import {
    type ActivityMessageNotification,
    type AiringNotification,
    type FollowingNotification,
    type MediaDataChangeNotification,
    type MediaDeletionNotification,
    type MediaMergeNotification,
    type RelatedMediaAdditionNotification,
    type ThreadLikeNotification,
    type ThreadNotification,
} from "../../Notification";

/**
 * `NotificationResponse` is a discriminated union representing a single notification returned by
 * the notification query. The GraphQL query flattens the `NotificationUnion` with one `...on X`
 * fragment per member, so exactly one member shape is present at runtime; narrow on the literal
 * `type` field to access member-specific properties.
 * @see https://docs.anilist.co/reference/union/notificationunion
 */
export type NotificationResponse =
    | AiringNotification
    | FollowingNotification
    | ActivityMessageNotification
    | ActivityNotification
    | ThreadNotification
    | ThreadLikeNotification
    | RelatedMediaAdditionNotification
    | MediaDataChangeNotification
    | MediaMergeNotification
    | MediaDeletionNotification;
