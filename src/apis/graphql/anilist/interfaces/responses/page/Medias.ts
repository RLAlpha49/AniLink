/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type MediaResponse } from "../query/Media";
import { type PageInfo } from "./PageInfo";
/**
 * `MediasPageResponse` — a page of media with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/media
 */
export interface MediasPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `media` is a list of `MediaResponse` entries representing the media.
     */
    media: MediaResponse[];
}

// @generated-end
