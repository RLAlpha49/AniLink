/**
 * `MediaListOptions` is a type representing the media list options for a user.
 * It includes fields for section order, split completed section by format, custom lists, advanced scoring,
 * advanced scoring enabled, and theme.
 */
export interface MediaListOptions {
  /**
   * `sectionOrder` is an array of strings representing the order of sections in the media list.
   */
  sectionOrder: string[]

  /**
   * `splitCompletedSectionByFormat` is a boolean indicating whether the completed section is split by format.
   */
  splitCompletedSectionByFormat: boolean

  /**
   * `customLists` is an array of strings representing the custom lists in the media list.
   */
  customLists: string[]

  /**
   * `advancedScoring` is an array of strings representing the advanced scoring options in the media list.
   */
  advancedScoring: string[]

  /**
   * `advancedScoringEnabled` is a boolean indicating whether advanced scoring is enabled.
   */
  advancedScoringEnabled: boolean

  /**
   * `theme` is a string representing the theme of the media list.
   */
  theme: string
}

/**
 * `MediaListOptionsMapping` is a constant that maps the `MediaListOptions` fields to their expected types.
 * The `sectionOrder`, `customLists`, `advancedScoring`, and `theme` fields are mapped to 'string',
 * and the `splitCompletedSectionByFormat` and `advancedScoringEnabled` fields are mapped to 'boolean'.
 */
export const MediaListOptionsMapping = {
  sectionOrder: 'string',
  splitCompletedSectionByFormat: 'boolean',
  customLists: 'string',
  advancedScoring: 'string',
  advancedScoringEnabled: 'boolean',
  theme: 'string'
}
