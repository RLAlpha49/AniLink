/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type Activity } from "../../Activity";
import { type PageInfo } from "./PageInfo";
/**
 * `ActivitiesPageResponse` — a page of activities with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export interface ActivitiesPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `activities` is a list of `Activity` entries representing the activities.
     */
    activities: Activity[];
}

// @generated-end
