/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `PageInfo` — pagination metadata returned by Page connections.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/pageinfo
 */
export interface PageInfo {
    /**
     * The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic
     */
    total: number;

    /**
     * The count on a page
     */
    perPage: number;

    /**
     * The current page
     */
    currentPage: number;

    /**
     * The last page
     */
    lastPage: number;

    /**
     * If there is another page
     */
    hasNextPage: boolean;
}

// @generated-end
