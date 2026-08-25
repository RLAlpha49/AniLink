/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type MediaListResponse } from "../query/MediaList";
import { type PageInfo } from "./PageInfo";
/**
 * `MediaListsPageResponse` — a page of media list entries with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export interface MediaListsPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `mediaList` is a list of `MediaListResponse` entries representing the media list.
     */
    mediaList: MediaListResponse[];
}

// @generated-end
