/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `FuzzyDate` — a fuzzy date with optional year, month, and day components.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/fuzzydate
 */
export interface FuzzyDate {
    /**
     * Numeric Year (2017)
     */
    year: number;

    /**
     * Numeric Month (3)
     */
    month: number;

    /**
     * Numeric Day (24)
     */
    day: number;
}

// @generated-end
