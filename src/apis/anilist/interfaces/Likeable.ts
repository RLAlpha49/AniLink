import { type ActivityReply, type Activity } from "./Activity";
import { type Thread, type ThreadComment } from "./Thread";

/**
 * `Likeable` is a discriminated union representing a single likeable entity returned
 * by the `ToggleLikeV2` mutation. The GraphQL selection set flattens the likeable
 * union with one `...on X` fragment per member, so exactly one member shape is
 * present at runtime; narrow on the literal `type` field (activities) or on
 * structural shape (threads and thread comments) to access member-specific
 * properties.
 * @see https://docs.anilist.co/reference/mutation
 */
export type Likeable = Activity | ActivityReply | Thread | ThreadComment;
