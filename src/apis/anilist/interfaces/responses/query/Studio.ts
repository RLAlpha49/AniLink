import { CharacterSchema } from './Character'
import { StaffSchema } from './Staff'
import { MediaSchema } from './Media'
import { Media } from '../../Media'
import { Staff } from '../../Staff'
import { NameSchema } from '../../Name'
import { ImageSchema } from '../../Image'

/**
 * `StudioResponse` is an interface representing the response from a studio query.
 * It includes the studio's id, name, animation studio status, media, site url, favourite status, and favourites count.
 */
export interface StudioResponse {
  id: number
  name: string
  isAnimationStudio: boolean
  media: {
    edges: Array<{
      id: number
      relationType: string
      isMainStudio: boolean
      characters: Staff
      characterRole: string
      characterName: string
      roleNotes: string
      dubGroup: string
      voiceActors: Staff
      voiceActorRole: {
        voiceActor: string
        roleNotes: string
        dubGroup: string
      }
      favouriteOrder: number
      node: Media
    }>
  }
  siteUrl: string
  isFavourite: boolean
  favourites: number
}

/**
 * `StudioSchema` is a constant representing the GraphQL schema for a studio query.
 * It includes the studio's id, name, animation studio status, media, site url, favourite status, and favourites count.
 */
export const StudioSchema = `
  id
  name
  isAnimationStudio
  media (sort: $mediaSort, isMain: $mediaIsMain onList: $mediaOnList, page: $mediaPage, perPage: $mediaPerPage) {
    edges {
      id
      relationType
      isMainStudio
      characters {
        ${CharacterSchema}
      }
      characterRole
      characterName
      roleNotes
      dubGroup
      voiceActors {
        ${StaffSchema}
      }
      voiceActorRoles {
        voiceActor {
          id
          ${NameSchema}
          ${ImageSchema}
        }
        roleNotes
        dubGroup
      }
      favouriteOrder
      node {
        ${MediaSchema}
      }
    }
    nodes {
      ${MediaSchema}
    }
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
  }
  siteUrl
  isFavourite
  favourites
`
