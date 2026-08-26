/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `Ranking` — a media ranking on a ranked chart.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediarank
 */
export interface Ranking {
    /**
     * The id of the rank
     */
    id: number;

    /**
     * The numerical rank of the media
     */
    rank: number;

    /**
     * The type of ranking
     */
    type: string;

    /**
     * The format the media is ranked within
     */
    format: string;

    /**
     * The year the media is ranked within
     */
    year: number;

    /**
     * The season the media is ranked within
     */
    season: string;

    /**
     * If the ranking is based on all time instead of a season/year
     */
    allTime: boolean;

    /**
     * String that gives context to the ranking type and time span
     */
    context: string;
}

// @generated-end
