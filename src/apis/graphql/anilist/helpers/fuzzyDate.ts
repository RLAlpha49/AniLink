import type { FuzzyDateInput } from "../types/FuzzyDate";

/** Options for the `fuzzyDate` convenience helper. All fields are optional. */
export interface FuzzyDateOptions {
    /** The year, e.g. `2024`. */
    year?: number;

    /** The 1-based month, e.g. `4` for April. */
    month?: number;

    /** The 1-based day of the month, e.g. `15`. */
    day?: number;
}

/**
 * Build an AniList `FuzzyDateInput` from optional year, month, and day parts.
 *
 * AniList accepts partial fuzzy dates (a year alone, or a year and month), and
 * treats missing parts as `null` rather than `0`. This helper omits any part
 * that is not provided so the resulting object only carries the fields the
 * caller actually knows, matching the `FuzzyDateInput` contract.
 *
 * @param options - The year, month, and day to include. All fields are optional.
 * @returns A `FuzzyDateInput` object containing only the provided parts.
 * @see https://docs.anilist.co/reference/input/fuzzydateinput
 * @example
 * ```typescript
 * const startedAt = fuzzyDate({ year: 2024, month: 4, day: 15 });
 * const yearOnly = fuzzyDate({ year: 2024 });
 * ```
 */
export function fuzzyDate(options?: FuzzyDateOptions): FuzzyDateInput {
    const input: FuzzyDateInput = {
        year: options?.year ?? (0 as number),
        month: options?.month ?? (0 as number),
        day: options?.day ?? (0 as number),
    };

    return input;
}
