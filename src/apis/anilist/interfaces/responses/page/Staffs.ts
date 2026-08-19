import { type StaffResponse } from "../query/Staff";
import { type PageInfo } from "./PageInfo";

/**
 * `StaffsPageResponse` is the paginated response from a staffs query.
 * @see https://docs.anilist.co/reference/object/staff
 */
export interface StaffsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Staff entries returned for the requested page. */
    staff: StaffResponse[];
}
