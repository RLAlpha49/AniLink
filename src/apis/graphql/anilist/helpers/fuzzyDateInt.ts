import type { FuzzyDateOptions } from "./fuzzyDate";

/**
 * Build an AniList `FuzzyDateInt` from optional year, month, and day parts.
 *
 * AniList's query arguments type fuzzy dates as the `FuzzyDateInt` scalar —
 * an integer in `YYYYMMDD` form (for example `19980401`), unlike the
 * `FuzzyDateInput` object the list-entry mutations take. This helper packs
 * optional date parts into that integer, filling each omitted part with
 * `0` exactly like the object form: `fuzzyDateInt({ year: 1998 })` is
 * `19980000`, `fuzzyDateInt({ year: 1998, month: 4 })` is `19980400`, and
 * `fuzzyDateInt()` is `0` (the all-zero date).
 *
 * Use it for the `startDate`/`endDate`/`startedAt`/`completedAt` filter
 * variables of the query operations (`query.media`, `query.mediaList`,
 * `query.mediaListCollection`, and their `page` counterparts); use
 * {@link fuzzyDate} for the `startedAt`/`completedAt` inputs of the
 * list-entry mutations.
 *
 * @param options - The {@link FuzzyDateOptions} values to include. All fields are optional.
 * @returns The `YYYYMMDD` integer AniList's `FuzzyDateInt` query arguments expect.
 * @see https://docs.anilist.co/reference/input/fuzzydateinput
 * @example
 * ```typescript
 * const startDate = fuzzyDateInt({ year: 2024, month: 4, day: 15 });
 * // 20240415
 *
 * const yearOnly = fuzzyDateInt({ year: 2024 });
 * // 20240000 — omitted parts become 0
 *
 * const page = await aniLink.anilist.query.page.medias({
 *   page: 1,
 *   perPage: 50,
 *   type: "ANIME",
 *   startDate,
 * });
 * ```
 */
export function fuzzyDateInt(options?: FuzzyDateOptions): number {
    const year = options?.year ?? 0;
    const month = options?.month ?? 0;
    const day = options?.day ?? 0;

    return year * 10000 + month * 100 + day;
}
