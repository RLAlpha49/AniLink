/**
 * {@link FuzzyDateInput} is the AniList FuzzyDateInput object: a date whose unknown parts
 * are `0` rather than omitted. All three fields are required — `19980000` means "April 1998
 * or later, day unknown". Build one with the `fuzzyDate` helper.
 * @see https://docs.anilist.co/reference/input/fuzzydateinput
 */
export type FuzzyDateInput = {
    /**
     * The year, `0` when unknown.
     */
    year: number;

    /**
     * The 1-based month, `0` when unknown.
     */
    month: number;

    /**
     * The day of the month, `0` when unknown.
     */
    day: number;
};

/**
 * {@link FuzzyDateMappings} is the field-shape map the list-entry mutations validate their
 * `startedAt`/`completedAt` {@link FuzzyDateInput} values against before dispatch.
 * @see https://docs.anilist.co/reference/input/fuzzydateinput
 */
export const FuzzyDateMappings = {
    year: "number",
    month: "number",
    day: "number",
};
