/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type StudioResponse } from "../query/Studio";
import { type PageInfo } from "./PageInfo";
/**
 * `StudiosPageResponse` — a page of studios with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/studio
 */
export interface StudiosPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `studios` is a list of `StudioResponse` entries representing the studios.
     */
    studios: StudioResponse[];
}

// @generated-end
