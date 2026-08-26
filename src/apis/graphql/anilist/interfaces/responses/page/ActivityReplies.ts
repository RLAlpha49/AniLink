/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type ActivityReply } from "../../Activity";
import { type PageInfo } from "./PageInfo";
/**
 * `ActivityRepliesPageResponse` — a page of activity replies with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/activityreply
 */
export interface ActivityRepliesPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `activityReplies` is a list of `ActivityReply` entries representing the activity replies.
     */
    activityReplies: ActivityReply[];
}

// @generated-end
