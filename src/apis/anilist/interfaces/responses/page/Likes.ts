import { type BasicUser } from "../../Basic";
import { type PageInfo } from "./PageInfo";

/**
 * `LikesPageResponse` is the paginated response from a likes query.
 * @see https://docs.anilist.co/reference/object/user
 */
export interface LikesPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Users who liked the requested item, returned for the page. */
    likes: BasicUser[];
}
