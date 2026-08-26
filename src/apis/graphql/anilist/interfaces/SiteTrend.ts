/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `SiteTrend` — a daily AniList activity statistic.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/sitetrend
 */
export interface SiteTrend {
    /**
     * The day the data was recorded (timestamp)
     */
    date: number;

    /**
     * `count` is a number value representing the count.
     */
    count: number;

    /**
     * The change from yesterday
     */
    change: number;
}

/**
 * `SiteTrendConnection` — a paginated connection of site trends.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/sitetrendconnection
 */
export interface SiteTrendConnection {
    /**
     * The pagination information
     */
    pageInfo: {
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
    };

    /**
     * `edges` is a list of `SiteTrendEdge` entries representing the edges.
     */
    edges: Array<{
        /**
         * `node` is an instance of `SiteTrend` representing the node.
         */
        node: SiteTrend;
    }>;

    /**
     * `nodes` is a list of `SiteTrend` entries representing the nodes.
     */
    nodes: SiteTrend[];
}

// @generated-end
