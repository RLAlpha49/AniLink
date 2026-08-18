/**
 * `PageInfo` is pagination metadata returned by an AniList page query.
 */
export interface PageInfo {
    /** Total number of items across all pages. */
    total: number;

    /** Number of items requested for the page. */
    perPage: number;

    /** One-based index of the current page. */
    currentPage: number;

    /** One-based index of the final page. */
    lastPage: number;

    /** Whether another page is available. */
    hasNextPage: boolean;
}
