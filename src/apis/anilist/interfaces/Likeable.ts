/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type Activity, type ActivityReply } from "./Activity";
import { type Thread, type ThreadComment } from "./Thread";
/**
 * `Likeable` — a likeable entity returned by ToggleLikeV2; narrow structurally because only activities carry a `type` discriminator.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/mutation
 */
export type Likeable = Activity | ActivityReply | Thread | ThreadComment;

// @generated-end
