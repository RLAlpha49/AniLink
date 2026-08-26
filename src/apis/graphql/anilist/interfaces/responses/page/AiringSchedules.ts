/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type AiringScheduleResponse } from "../query/AiringSchedule";
import { type PageInfo } from "./PageInfo";
/**
 * `AiringSchedulesPageResponse` — a page of airing schedule entries with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/airingschedule
 */
export interface AiringSchedulesPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `airingSchedules` is a list of `AiringScheduleResponse` entries representing the airing schedules.
     */
    airingSchedules: AiringScheduleResponse[];
}

// @generated-end
