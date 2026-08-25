/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type ThreadResponse } from "./responses/query/Thread";
import { type ThreadCommentResponse } from "./responses/query/ThreadComment";
/**
 * `Thread` — an alias of ThreadResponse for readability at call sites.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/thread
 */
export type Thread = ThreadResponse;

/**
 * `ThreadComment` — an alias of ThreadCommentResponse for readability at call sites.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export type ThreadComment = ThreadCommentResponse;

// @generated-end
