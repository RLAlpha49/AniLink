import { type UserResponse } from "../query/User";
import { type PageInfo } from "./PageInfo";

/**
 * `FollowingsPageResponse` is the paginated response from a followings query.
 * @see https://docs.anilist.co/reference/object/user
 */
export interface FollowingsPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Following users returned for the requested page. */
    following: UserResponse[];
}
