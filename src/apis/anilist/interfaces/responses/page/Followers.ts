import { type UserResponse } from "../query/User";
import { type PageInfo } from "./PageInfo";

/**
 * `FollowersPageResponse` is the paginated response from a followers query.
 */
export interface FollowersPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Followers returned for the requested page. */
    followers: UserResponse[];
}
