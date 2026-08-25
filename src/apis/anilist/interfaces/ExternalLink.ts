/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `ExternalLink` — an external link associated with a media.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediaexternallink
 */
export interface ExternalLink {
    /**
     * The id of the external link
     */
    id: number;

    /**
     * The url of the external link or base url of link source
     */
    url: string;

    /**
     * The links website site name
     */
    site: string;
}

// @generated-end
