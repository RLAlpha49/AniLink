import type { CustomRequest } from "../CustomRequest";

/**
 * The `custom` member group of the `AniListApi` type.
 *
 * @see https://docs.anilist.co/reference/query
 * @see https://docs.anilist.co/reference/mutation
 */
export type AniListCustom = {
    /**
     * {@link AniListCustom.custom} sends a caller-authored GraphQL query or mutation document to AniList.
     * Use it as an escape hatch when no typed operation fits: the `query` string is sent
     * verbatim and the `variables` argument is forwarded as-is. A document with a single
     * root field resolves to the bare field value; a document with multiple root fields
     * resolves to the full `{ data }` envelope.
     * @param query - The GraphQL query or mutation document to send verbatim.
     * @param variables - The variables to forward with the request. Optional.
     * @param options - Optional per-request transport settings (`RequestOptions`) merged over the instance-level ones for this call only.
     * @returns {Promise<T>} A promise that resolves to the unwrapped response, typed as `T` (defaults to `unknown`).
     * @throws {AniLinkError} When the request fails. When AniList returns partial success (some fields resolve while others fail inside an HTTP 200 envelope), the thrown `AniLinkGraphQLError` exposes the resolved portion via its `partialData` field, so the fields that did resolve remain recoverable from the error.
     * @see https://docs.anilist.co/reference/query
     * @see https://docs.anilist.co/reference/mutation
     * @example
     * ```typescript
     * const viewer = await aniLink.anilist.custom('query {Viewer {id}}');
     *
     * const mutation = 'mutation ($about: String) {UpdateUser (about: $about) {id}}';
     * const variables = { about: "New about text" };
     * const response = await aniLink.anilist.custom(mutation, variables);
     * ```
     */
    custom: CustomRequest["custom"];

    /**
     * {@link AniListCustom.customPage} walks a caller-authored `Page` document through the shared
     * pagination engine — the paginated escape hatch for collections whose field combination the
     * generated page operations do not expose. The document must declare the standard AniList
     * `Page` wrapper with `$page`/`$perPage` `Int` variables and select `pageInfo { hasNextPage }`
     * plus an items array; the traversal reuses every engine guard (`perPage` clamping, the
     * `maxPages` bound, look-ahead `concurrency`, `AbortSignal` forwarding, the `lastPage`
     * terminal bound).
     * @param query - The GraphQL document to traverse: a `query` selecting the `Page` root field with `$page`/`$perPage` variables.
     * @param itemsKey - The key of the items array on the `Page` response (e.g. `"media"`, `"characters"`).
     * @param variables - The variables for the document, forwarded on every page request with `page`/`perPage` merged over them. Optional.
     * @param options - Optional `CustomPageOptions` (`perPage`, `startPage`, `maxPages`, `concurrency`, `signal`, `onPage`) plus per-request transport settings under `transportOptions`.
     * @returns {Promise<PaginateResult<TItem>>} The collected items, per-page snapshots, page count, and truncation flag; a `PaginateResult`.
     * @throws {AniLinkValidationError} When the document is not a `query` selecting the `Page` root field, or a fetched page response has no `itemsKey` key.
     * @see https://docs.anilist.co/reference/object/page
     * @example
     * ```typescript
     * const result = await aniLink.anilist.customPage(
     *     `query ($page: Int, $perPage: Int) {
     *         Page(page: $page, perPage: $perPage) {
     *             pageInfo { hasNextPage }
     *             media(type: ANIME, sort: POPULARITY_DESC) { id title { romaji } }
     *         }
     *     }`,
     *     "media",
     *     {},
     *     { perPage: 50, maxPages: 5 }
     * );
     * console.log(result.items.length, result.truncated);
     * ```
     */
    customPage: CustomRequest["customPage"];
};
