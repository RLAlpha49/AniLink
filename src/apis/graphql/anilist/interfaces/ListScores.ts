/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `ListScores` — the mean score and score deviation of a user's list.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/listscorestats
 */
export interface ListScores {
    /**
     * `meanScore` is a number value representing the mean score.
     */
    meanScore: number;

    /**
     * `standardDeviation` is a number value representing the standard deviation.
     */
    standardDeviation: number;
}

// @generated-end
