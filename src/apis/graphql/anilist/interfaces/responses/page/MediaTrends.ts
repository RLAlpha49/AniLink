/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type MediaTrendResponse } from "../query/MediaTrend";
import { type PageInfo } from "./PageInfo";
/**
 * `MediaTrendsPageResponse` — a page of media trends with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediatrend
 */
export interface MediaTrendsPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `mediaTrends` is a list of `MediaTrendResponse` entries representing the media trends.
     */
    mediaTrends: MediaTrendResponse[];
}

// @generated-end
