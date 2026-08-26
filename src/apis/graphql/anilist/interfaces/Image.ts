/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `Image` — an image resource in its large and medium variants.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/characterimage
 */
export interface Image {
    /**
     * The character's image of media at its largest size
     */
    large: string;

    /**
     * The character's image of media at medium size
     */
    medium: string;
}

// @generated-end
