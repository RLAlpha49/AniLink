import { type AiringScheduleResponse } from "../query/AiringSchedule";
import { type PageInfo } from "./PageInfo";

/**
 * `AiringSchedulesPageResponse` is the paginated response from an airing schedules query.
 */
export interface AiringSchedulesPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Airing schedules returned for the requested page. */
    airingSchedules: AiringScheduleResponse[];
}
