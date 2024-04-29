/**
 * `ExternalLinkSourceCollectionResponse` is an interface representing the response from an external link source collection query.
 * It includes the id, url, site, siteId, type, language, color, icon, notes, and the disabled status of the external link source.
 */
export interface ExternalLinkSourceCollectionResponse {
  /**
   * `id` is a number representing the id of the external link source.
   */
  id: number

  /**
   * `url` is a string representing the url of the external link source.
   */
  url: string

  /**
   * `site` is a string representing the site of the external link source.
   */
  site: string

  /**
   * `siteId` is a string representing the site id of the external link source.
   */
  siteId: string

  /**
   * `type` is a string representing the type of the external link source.
   */
  type: string

  /**
   * `language` is a string representing the language of the external link source.
   */
  language: string

  /**
   * `color` is a string representing the color of the external link source.
   */
  color: string

  /**
   * `icon` is a string representing the icon of the external link source.
   */
  icon: string

  /**
   * `notes` is a string representing the notes of the external link source.
   */
  notes: string

  /**
   * `isDisabled` is a boolean representing the disabled status of the external link source.
   */
  isDisabled: boolean
}
