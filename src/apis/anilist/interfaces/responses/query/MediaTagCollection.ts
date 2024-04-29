import { Tag } from '../../Tag'

/**
 * `MediaTagCollectionResponse` is an interface representing the response from a media tag collection query.
 * It includes the MediaTag of type `Tag`.
 */
export interface MediaTagCollectionResponse {
  MediaTag: Tag
}
