import { AniListOperation } from "./AniListOperation";
import type { RequestOptions } from "../../../base/RequestHandler";
import { AniLinkValidationError } from "../../../base/AniLinkError";
import { extractQueryRootField } from "../../../base/responseCache";
import type { PageInfo } from "./interfaces/responses/page/PageInfo";
import {
    paginate,
    type ArrayElement,
    type PaginateOptions,
    type PaginateResult,
} from "./Paginator";

/**
 * Matches a GraphQL document that declares an executable operation.
 *
 * Accepted shapes: an anonymous shorthand selection (`{ Viewer { id } }`),
 * or a document opening with the `query` or `mutation` keyword followed by
 * a selection set. Fragment-only documents are not executable, so they
 * are rejected.
 *
 * Leading `#` comment lines and whitespace are stripped before the test, so
 * a copied document that opens with a comment (`# fetch viewer\nquery { … }`)
 * validates locally exactly as the server would accept it.
 *
 * This is a deliberately lightweight guard, not a parser: it catches empty
 * payloads and non-documents locally so the most obvious mistakes fail fast
 * instead of as remote 400 responses. Full syntax validation is left to the
 * AniList API.
 */
const GRAPHQL_OPERATION_PATTERN = /^\s*(?:\{|(?:query|mutation)\b[\s\S]*\{)/;

/**
 * Matches a caller-authored document shaped for {@link CustomRequest.customPage}:
 * an executable `query` document that declares the standard AniList `Page`
 * wrapper. The document must open with the `query` keyword (a paginated
 * traversal is always a read), select the `Page` root field, and reference
 * the `$page`/`$perPage` variables the traversal feeds — the same lightweight
 * structural guard as {@link GRAPHQL_OPERATION_PATTERN}, not a parser. Full
 * syntax validation is left to the AniList API.
 */
const GRAPHQL_PAGE_QUERY_PATTERN = /^\s*query\b[\s\S]*\bPage\s*\(/;

/** The single validation message both `customPage` rejection sites raise. */
const CUSTOM_PAGE_VALIDATION_MESSAGE =
    "customPage() requires a query document whose single root field is Page, selecting it with $page and $perPage Int variables";

/**
 * Strips leading `#` comment lines and blank lines from a GraphQL document
 * so the operation pattern can anchor at the first executable token. Only
 * the document head is stripped — comments between selections are untouched
 * and remain the server's concern.
 */
const stripLeadingComments = (query: string): string => {
    let rest = query;
    for (;;) {
        // Consume one leading blank-or-comment line per iteration; a flat
        // loop avoids the nested-quantifier regex the security linter flags.
        const line = /^[^\n]*\n/.exec(rest);
        if (line === null) {
            return rest;
        }
        if (!/^\s*(#|$)/.test(line[0])) {
            return rest;
        }
        rest = rest.slice(line[0].length);
    }
};

/**
 * Options accepted by {@link CustomRequest.customPage}: the shared
 * pagination traversal controls plus per-request transport settings for
 * the page fetches.
 *
 * Named so the paginated escape hatch's public signature stays a single
 * reference instead of an inlined intersection at every call site (the
 * method, the facade property, and the generated operation reference).
 *
 * @see https://docs.anilist.co/reference/object/page
 */
export interface CustomPageOptions extends PaginateOptions {
    /**
     * Per-request transport settings (`timeout`, retry policy, lifecycle
     * hooks, pacing) merged over the instance-level options for each page
     * request of this traversal only. The traversal's bridged
     * `AbortSignal` always wins over any `signal` set here.
     */
    transportOptions?: RequestOptions;
}

/**
 * `CustomRequest` sends caller-authored GraphQL documents to AniList — the
 * escape hatch for queries and mutations the typed operation surface does
 * not cover.
 *
 * @see https://docs.anilist.co/reference/query
 * @see https://docs.anilist.co/reference/mutation
 */
export class CustomRequest extends AniListOperation {
    /**
     * `custom` sends a caller-authored GraphQL query or mutation document.
     *
     * The response follows the same unwrapping rule as every other operation:
     * a document with a single root field resolves to the bare field value,
     * while a document with multiple root fields resolves to the full
     * `{ data }` envelope. Annotate `T` with the shape you expect — the bare
     * value for single-root-field documents, or the envelope type itself when
     * the document selects several root fields:
     *
     * ```typescript
     * const viewer = await aniLink.anilist.custom<{ id: number }>("query { Viewer { id } }");
     *
     * // Multi-root-field document: T is the full envelope.
     * const both = await aniLink.anilist.custom<{ data: { Media: { id: number }; User: { id: number } } }>(
     *     "query { Media (id: 1) { id } User (id: 1) { id } }"
     * );
     * ```
     *
     * @param query - The GraphQL document to execute. It must declare an executable operation: an anonymous shorthand selection (`{ Viewer { id } }`) or a `query`/`mutation` document. AniList's HTTP endpoint does not serve subscriptions, so `subscription` documents are rejected here rather than failing remotely.
     * @param variables - The variables for the document. This parameter is optional.
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     * @returns A promise that resolves to the unwrapped response data for single-root-field documents, or the full `{ data }` envelope otherwise.
     * @throws An {@link AniLinkValidationError} when the query is empty or is not an executable document (for example a fragment-only definition).
     * @throws An `AniLinkError` when the request fails. When AniList returns partial success (some fields resolve while others fail inside an HTTP 200 envelope), the thrown `AniLinkGraphQLError` exposes the resolved portion via its `partialData` field, so the fields that did resolve remain recoverable from the error.
     * @see https://docs.anilist.co/reference/query
     * @see https://docs.anilist.co/reference/mutation
     */
    async custom<T = unknown>(
        query: string,
        variables: Record<string, unknown> = {},
        options?: RequestOptions
    ): Promise<T> {
        if (
            typeof query !== "string" ||
            !GRAPHQL_OPERATION_PATTERN.test(stripLeadingComments(query))
        ) {
            throw new AniLinkValidationError([
                "custom() requires an executable GraphQL document (an anonymous selection or a query/mutation operation)",
            ]);
        }
        return await this.request<T>(query, variables, { transportOptions: options });
    }

    /**
     * `customPage` walks a caller-authored `Page` document through the shared
     * pagination engine — the paginated escape hatch for collections whose
     * field combination the generated page operations do not expose.
     *
     * The document must declare the standard AniList `Page` wrapper with
     * `$page`/`$perPage` `Int` variables and select `pageInfo { hasNextPage }`
     * (the engine's terminal flag) plus an items array under a key of your
     * choosing. Because `Page` is the document's single root field, the
     * response unwraps to the bare `Page` object, so `TPage` is the `Page`
     * selection's shape — not an envelope:
     *
     * ```typescript
     * const result = await aniLink.anilist.customPage(
     *     `query ($page: Int, $perPage: Int) {
     *         Page(page: $page, perPage: $perPage) {
     *             pageInfo { total currentPage lastPage hasNextPage }
     *             media(type: ANIME, sort: POPULARITY_DESC) { id title { romaji } }
     *         }
     *     }`,
     *     "media",
     *     {},
     *     { perPage: 50, maxPages: 5 }
     * );
     * ```
     *
     * The traversal reuses every engine guard: `perPage` clamping (AniList caps
     * it at 50), the `maxPages` bound (default 100), look-ahead `concurrency`
     * (default 3), `AbortSignal` forwarding, and the `pageInfo.lastPage`
     * terminal bound. `variables` are forwarded verbatim on every page
     * request with `page`/`perPage` merged over them.
     *
     * @typeParam TPage - The `Page` selection's response shape; must include `pageInfo` (the engine reads `pageInfo.hasNextPage`).
     * @typeParam K - The key of the items array on `TPage` (e.g. `"media"`).
     * @param query - The GraphQL document to traverse. It must be a `query` document whose single root field is `Page`, selected with `$page`/`$perPage` variables; mutation documents, non-`Page` documents, and documents with additional root fields are rejected locally.
     * @param itemsKey - The key of the items array on the `Page` response (e.g. `"media"`, `"characters"`).
     * @param variables - The variables for the document, forwarded on every page request with `page`/`perPage` merged over them. This parameter is optional.
     * @param options - Optional `CustomPageOptions`: the `PaginateOptions` controls (`perPage`, `startPage`, `maxPages`, `concurrency`, `signal`, `onPage`, `onHookError`, `diagnostics`) plus per-request transport settings under `transportOptions`, merged over the instance-level ones for this call only.
     * @returns The collected items, per-page snapshots, page count, and whether the `maxPages` guard or the server-reported `lastPage` bound truncated the run; a `PaginateResult`.
     * @throws An {@link AniLinkValidationError} when the document is not a `query` selecting the `Page` root field with `$page`/`$perPage` variable references, or when a fetched page response has no `itemsKey` key at all.
     * @throws An `AniLinkError` when a page request fails.
     * @see https://docs.anilist.co/reference/object/page
     * @example
     * ```typescript
     * const result = await aniLink.anilist.customPage(
     *     `query ($page: Int, $perPage: Int) {
     *         Page(page: $page, perPage: $perPage) {
     *             pageInfo { hasNextPage }
     *             characters(search: "spike") { id name { full } }
     *         }
     *     }`,
     *     "characters",
     *     {},
     *     { perPage: 50, maxPages: 3 }
     * );
     * console.log(result.items.length, result.truncated);
     * ```
     */
    async customPage<TPage extends { pageInfo: PageInfo }, K extends string>(
        query: string,
        itemsKey: K,
        variables: Record<string, unknown> = {},
        options?: CustomPageOptions
    ): Promise<PaginateResult<ArrayElement<TPage, K>>> {
        if (typeof query !== "string") {
            throw new AniLinkValidationError([CUSTOM_PAGE_VALIDATION_MESSAGE]);
        }
        // One normalization pass feeds every structural check, so a leading
        // comment can neither satisfy nor spoil any of them — and the
        // variable checks are word-boundary matches, so `$pageLimit` (or a
        // `# $page` comment) cannot masquerade as the `$page` the
        // traversal feeds.
        const normalized = stripLeadingComments(query);
        if (
            !GRAPHQL_OPERATION_PATTERN.test(normalized) ||
            !GRAPHQL_PAGE_QUERY_PATTERN.test(normalized) ||
            extractQueryRootField({ query }) !== "Page" ||
            !/\$page\b/.test(normalized) ||
            !/\$perPage\b/.test(normalized)
        ) {
            throw new AniLinkValidationError([CUSTOM_PAGE_VALIDATION_MESSAGE]);
        }
        const { transportOptions, ...paginateOptions } = options ?? {};
        return await paginate<TPage, K>(
            (page, perPage, signal) =>
                this.request<TPage>(
                    query,
                    { ...variables, page, perPage },
                    { transportOptions: { ...transportOptions, signal } }
                ),
            itemsKey,
            paginateOptions
        );
    }
}
