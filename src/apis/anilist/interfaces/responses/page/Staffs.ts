import { type StaffResponse } from "../query/Staff";
import { type PageInfo } from "./PageInfo";

/**
 * `StaffsPageResponse` is the paginated response from a staffs query.
 */
export interface StaffsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Staff entries returned for the requested page. */
    staff: StaffResponse[];
}
