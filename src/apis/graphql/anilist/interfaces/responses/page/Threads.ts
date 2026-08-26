/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type ThreadResponse } from "../query/Thread";
import { type PageInfo } from "./PageInfo";
/**
 * `ThreadsPageResponse` — a page of forum threads with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/thread
 */
export interface ThreadsPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `threads` is a list of `ThreadResponse` entries representing the threads.
     */
    threads: ThreadResponse[];
}

// @generated-end
