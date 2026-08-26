/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `ActivityHistory` — a daily activity history entry of a user.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/useractivityhistory
 */
export interface ActivityHistory {
    /**
     * The day the activity took place (Unix timestamp)
     */
    date: number;

    /**
     * The amount of activity on the day
     */
    amount: number;

    /**
     * The level of activity represented on a 1-10 scale
     */
    level: number;
}

// @generated-end
