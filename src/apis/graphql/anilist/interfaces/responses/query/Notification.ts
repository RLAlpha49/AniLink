/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
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
 * `NotificationResponse` — a single notification returned by the notification query; narrow on the literal `type` field.
 *
 * Generated from the schema fragments; do not edit by hand.
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

// @generated-end
