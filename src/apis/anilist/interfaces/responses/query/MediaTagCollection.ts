import { type Tag } from '../../Tag'

/**
 * `MediaTagCollectionResponse` is an interface representing the response from a media tag collection query.
 * It includes the `MediaTag` of type `Tag`.
 */
export interface MediaTagCollectionResponse {
  /**
   * `MediaTag` is an instance of `Tag` representing the media tag in the response.
   */
  MediaTag: Tag
}
