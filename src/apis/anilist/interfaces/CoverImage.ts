/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `CoverImage` — a media cover image.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediacoverimage
 */
export interface CoverImage {
    /**
     * The cover image url of the media at its largest size. If this size isn't available, large will be provided instead.
     */
    extraLarge: string;

    /**
     * The cover image url of the media at a large size
     */
    large: string;

    /**
     * The cover image url of the media at medium size
     */
    medium: string;

    /**
     * Average #hex color of cover image
     */
    color: string;
}

// @generated-end
