/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `MediaTagCollectionResponse` — a media tag as returned by the MediaTagCollection query.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediatag
 */
export interface MediaTagCollectionResponse {
    /**
     * The id of the tag
     */
    id: number;

    /**
     * The name of the tag
     */
    name: string;

    /**
     * A general description of the tag
     */
    description: string;

    /**
     * The categories of tags this tag belongs to
     */
    category: string;

    /**
     * The relevance ranking of the tag out of the 100 for this media
     */
    rank: number;

    /**
     * If the tag could be a spoiler for any media
     */
    isGeneralSpoiler: boolean;

    /**
     * If the tag is a spoiler for this media
     */
    isMediaSpoiler: boolean;

    /**
     * If the tag is only for adult 18+ media
     */
    isAdult: boolean;

    /**
     * The user who submitted the tag
     */
    userId: number;
}

// @generated-end
