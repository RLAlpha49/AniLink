/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `ScoreDistribution` — how many media fall into each 10-point score bucket.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/scoredistribution
 */
export interface ScoreDistribution {
    /**
     * `score` is a number value representing the score.
     */
    score: number;

    /**
     * The amount of list entries with this score
     */
    amount: number;
}

/**
 * `StatusDistribution` — how many media carry each list status.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/statusdistribution
 */
export interface StatusDistribution {
    /**
     * The day the activity took place (Unix timestamp)
     */
    status: string;

    /**
     * The amount of entries with this status
     */
    amount: number;
}

// @generated-end
