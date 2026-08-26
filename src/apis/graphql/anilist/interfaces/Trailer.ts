/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `Trailer` — a media trailer hosted on an external site.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediatrailer
 */
export interface Trailer {
    /**
     * The trailer video id
     */
    id: string;

    /**
     * The site the video is hosted by (Currently either youtube or dailymotion)
     */
    site: string;

    /**
     * The url for the thumbnail image of the video
     */
    thumbnail: string;
}

// @generated-end
