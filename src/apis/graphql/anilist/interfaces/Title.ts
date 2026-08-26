/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `Title` — the localized title variants of a media.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediatitle
 */
export interface Title {
    /**
     * The romanization of the native language title
     */
    romaji: string;

    /**
     * The official english title
     */
    english: string;

    /**
     * Official title in it's native language
     */
    native: string;

    /**
     * The currently authenticated users preferred title language. Default romaji for non-authenticated
     */
    userPreferred: string;
}

// @generated-end
