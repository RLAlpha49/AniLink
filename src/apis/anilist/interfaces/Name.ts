/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `Name` — the name parts of a character or staff member.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/charactername
 */
export interface Name {
    /**
     * The character's given name
     */
    first: string;

    /**
     * The character's surname
     */
    last: string;

    /**
     * The character's first and last name
     */
    full: string;

    /**
     * The character's full name in their native language
     */
    native: string;
}

// @generated-end
