/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type StaffResponse } from "../query/Staff";
import { type PageInfo } from "./PageInfo";
/**
 * `StaffsPageResponse` — a page of staff members with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/staff
 */
export interface StaffsPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `staff` is a list of `StaffResponse` entries representing the staff.
     */
    staff: StaffResponse[];
}

// @generated-end
