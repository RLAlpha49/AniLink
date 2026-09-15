/**
 * {@link MediaListOptions} is the per-type list layout a user configures: section order,
 * custom lists, and scoring display. `UpdateUser` accepts it as `animeListOptions`/
 * `mangaListOptions`.
 * @see https://docs.anilist.co/reference/object/medialistoptions
 */
export type MediaListOptions = {
    /**
     * `sectionOrder` is an array of strings representing the order of sections in the media list.
     */
    sectionOrder: string[];

    /**
     * `splitCompletedSectionByFormat` is a boolean indicating whether the completed section is split by format.
     */
    splitCompletedSectionByFormat: boolean;

    /**
     * `customLists` is an array of strings representing the custom lists in the media list.
     */
    customLists: string[];

    /**
     * `advancedScoring` is an array of strings representing the advanced scoring options in the media list.
     */
    advancedScoring: string[];

    /**
     * `advancedScoringEnabled` is a boolean indicating whether advanced scoring is enabled.
     */
    advancedScoringEnabled: boolean;

    /**
     * `theme` is a string representing the theme of the media list.
     */
    theme: string;
};

/**
 * {@link MediaListOptionsMapping} is the field-shape map `UpdateUser` validates its
 * `animeListOptions`/`mangaListOptions` values against before dispatch.
 * @see https://docs.anilist.co/reference/object/medialistoptions
 */
export const MediaListOptionsMapping = {
    sectionOrder: "string",
    splitCompletedSectionByFormat: "boolean",
    customLists: "string",
    advancedScoring: "string",
    advancedScoringEnabled: "boolean",
    theme: "string",
};
