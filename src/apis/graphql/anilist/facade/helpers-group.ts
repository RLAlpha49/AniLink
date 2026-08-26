/**
 * The pagination and pure-helper members of the `AniListApi` type.
 */
import { type MediaListCollectionResponse } from "../interfaces/responses/query/MediaListCollectionResponse";
import { type FuzzyDateOptions } from "../helpers/fuzzyDate";
import { type FlattenedMediaListEntry } from "../helpers/flattenMediaListCollection";
import {
    type PaginateOptions,
    type PaginateResult,
    type ChunkPaginateOptions,
    type ChunkPaginateResult,
} from "../Paginator";
import { type PageInfo } from "../interfaces/responses/page/PageInfo";
import { type FuzzyDateInput } from "../types/FuzzyDate";

/** Callback that fetches a single `PageInfo`-based page. */
type PageFetcher<TPage extends { pageInfo: PageInfo }> = (
    page: number,
    perPage: number
) => Promise<TPage>;

/** Callback that fetches a single `MediaListCollection` chunk. */
type ChunkFetcher<TChunk extends { hasNextChunk: boolean }> = (
    chunk: number,
    perChunk: number
) => Promise<TChunk>;

export type AniListHelpers = {
    /**
     * Iterates `PageInfo`-based pages until `hasNextPage` is false or `maxPages` is reached.
     * @param fetchPage - Callback that fetches a single page given its 1-based number and `perPage`.
     * @param itemsKey - The key of the items array on the page response (e.g. `"media"`, `"users"`).
     * @param options - Optional `perPage`, `startPage`, and `maxPages` controls.
     * @returns The collected items, per-page snapshots, page count, and whether the guard truncated the run.
     * @see https://docs.anilist.co/reference/object/pageinfo
     * @example
     * ```typescript
     * const result = await aniLink.anilist.paginate(
     *   (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" }),
     *   "media",
     *   { perPage: 50, maxPages: 10 }
     * );
     * ```
     */
    paginate: <
        TPage extends { pageInfo: PageInfo },
        K extends {
            [P in keyof TPage]: TPage[P] extends readonly unknown[] ? P : never;
        }[keyof TPage] &
            keyof TPage,
    >(
        fetchPage: PageFetcher<TPage>,
        itemsKey: K,
        options?: PaginateOptions
    ) => Promise<PaginateResult<TPage[K] extends readonly (infer U)[] ? U : never>>;

    /**
     * Async generator yielding each `PageInfo`-based page until `hasNextPage` is false or `maxPages` is reached.
     * @param fetchPage - Callback that fetches a single page given its 1-based number and `perPage`.
     * @param options - Optional `perPage`, `startPage`, and `maxPages` controls.
     * @returns An async generator yielding each raw page response in turn.
     * @see https://docs.anilist.co/reference/object/pageinfo
     * @example
     * ```typescript
     * for await (const page of aniLink.anilist.paginatePages(
     *   (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" })
     * )) {
     *   console.log(page.pageInfo.currentPage, page.media.length);
     * }
     * ```
     */
    paginatePages: <TPage extends { pageInfo: PageInfo }>(
        fetchPage: PageFetcher<TPage>,
        options?: PaginateOptions
    ) => AsyncGenerator<TPage>;

    /**
     * Iterates `MediaListCollection` chunks until `hasNextChunk` is false or `maxChunks` is reached.
     * @param fetchChunk - Callback that fetches a single chunk given its 1-based number and `perChunk`.
     * @param itemsKey - The key of the items array on the chunk response (e.g. `"lists"`).
     * @param options - Optional `perChunk`, `startChunk`, and `maxChunks` controls.
     * @returns The collected items, per-chunk snapshots, chunk count, and whether the guard truncated the run.
     * @see https://docs.anilist.co/reference/object/medialistcollection
     * @example
     * ```typescript
     * const result = await aniLink.anilist.paginateChunks(
     *   (chunk, perChunk) => aniLink.anilist.query.mediaListCollection(
     *     { userId: 542244, type: "ANIME", chunk, perChunk }
     *   ),
     *   "lists",
     *   { perChunk: 500, maxChunks: 20 }
     * );
     * ```
     */
    paginateChunks: <
        TChunk extends { hasNextChunk: boolean },
        K extends {
            [P in keyof TChunk]: TChunk[P] extends readonly unknown[] ? P : never;
        }[keyof TChunk] &
            keyof TChunk,
    >(
        fetchChunk: ChunkFetcher<TChunk>,
        itemsKey: K,
        options?: ChunkPaginateOptions
    ) => Promise<ChunkPaginateResult<TChunk[K] extends readonly (infer U)[] ? U : never>>;

    /**
     * Builds an AniList `FuzzyDateInput` from optional year, month, and day parts.
     * @param options - The year, month, and day to include. All fields are optional.
     * @returns A `FuzzyDateInput` object containing only the provided parts.
     * @see https://docs.anilist.co/reference/input/fuzzydateinput
     * @example
     * ```typescript
     * const startedAt = aniLink.anilist.fuzzyDate({ year: 2024, month: 4, day: 15 });
     * ```
     */
    fuzzyDate: (options?: FuzzyDateOptions) => FuzzyDateInput;

    /**
     * Flattens a `MediaListCollection` response into a single array of entries tagged with their list group.
     * @param response - The `MediaListCollectionResponse` returned by `mediaListCollection`.
     * @returns A flat array of entries across all list groups.
     * @see https://docs.anilist.co/reference/object/medialistcollection
     * @example
     * ```typescript
     * const collection = await aniLink.anilist.query.mediaListCollection({ userId: 542244, type: "ANIME" });
     * const entries = aniLink.anilist.flattenMediaListCollection(collection);
     * console.log(entries.length, entries[0].listName);
     * ```
     */
    flattenMediaListCollection: (
        response: MediaListCollectionResponse
    ) => FlattenedMediaListEntry[];
};
