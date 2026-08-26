/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `ExternalLinkSourceCollectionResponse` — an external link source with streaming metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediaexternallink
 */
export interface ExternalLinkSourceCollectionResponse {
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

    /**
     * The links website site id
     */
    siteId: number;

    /**
     * `type` is a string value representing the type.
     */
    type: string;

    /**
     * Language the site content is in. See Staff language field for values.
     */
    language: string;

    /**
     * `color` is a string value representing the color.
     */
    color: string;

    /**
     * The icon image url of the site. Not available for all links. Transparent PNG 64x64
     */
    icon: string;

    /**
     * `notes` is a string value representing the notes.
     */
    notes: string;

    /**
     * `isDisabled` is a boolean value representing the is disabled.
     */
    isDisabled: boolean;
}

// @generated-end
