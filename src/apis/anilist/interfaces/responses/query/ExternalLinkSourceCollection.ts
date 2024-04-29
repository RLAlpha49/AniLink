/**
 * `ExternalLinkSourceCollectionResponse` is an interface representing the response from an external link source collection query.
 * It includes the id, url, site, siteId, type, language, color, icon, notes, and the disabled status of the external link source.
 */
export interface ExternalLinkSourceCollectionResponse {
  id: number
  url: string
  site: string
  siteId: string
  type: string
  language: string
  color: string
  icon: string
  notes: string
  isDisabled: boolean
}
