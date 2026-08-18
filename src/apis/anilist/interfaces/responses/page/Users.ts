import { type UserResponse } from "../query/User";
import { type PageInfo } from "./PageInfo";

/**
 * `UsersPageResponse` is the paginated response from a users query.
 */
export interface UsersPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Users returned for the requested page. */
    users: UserResponse[];
}
