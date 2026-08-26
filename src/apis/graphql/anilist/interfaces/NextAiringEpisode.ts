/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `NextAiringEpisode` — the upcoming airing schedule entry of an anime.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/airingschedule
 */
export interface NextAiringEpisode {
    /**
     * The time the episode airs at
     */
    airingAt: number;

    /**
     * Seconds until episode starts airing
     */
    timeUntilAiring: number;

    /**
     * The airing episode number
     */
    episode: number;
}

// @generated-end
