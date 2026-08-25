/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type UserResponse } from "../query/User";
import { type PageInfo } from "./PageInfo";
/**
 * `UsersPageResponse` — a page of users with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/user
 */
export interface UsersPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `users` is a list of `UserResponse` entries representing the users.
     */
    users: UserResponse[];
}

// @generated-end
