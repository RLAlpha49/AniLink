import type { FuzzyDateInput } from "../types/FuzzyDate";

/**
 * Options for building a partial {@link FuzzyDateInput} with {@link fuzzyDate}.
 *
 * Omitted fields retain the zero-value representation required by AniList's fuzzy-date input.
 *
 * @see https://docs.anilist.co/reference/input/fuzzydateinput
 */
export interface FuzzyDateOptions {
    /** The year, e.g. `2024`. */
    year?: number;

    /** The 1-based month, e.g. `4` for April. */
    month?: number;

    /** The 1-based day of the month, e.g. `15`. */
    day?: number;
}

/**
 * Build an AniList {@link FuzzyDateInput} from optional year, month, and day parts.
 *
 * AniList represents unknown fuzzy-date parts as `0` in this input shape. This
 * helper fills each omitted part with `0`, so the result always matches the
 * required fields of the {@link FuzzyDateInput} contract.
 *
 * @param options - The {@link FuzzyDateOptions} values to include. All fields are optional.
 * @returns A {@link FuzzyDateInput} object with omitted parts set to `0`.
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
