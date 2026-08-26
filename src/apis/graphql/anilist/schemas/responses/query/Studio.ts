import { ImageSchema } from "../../Image";
import { NameSchema } from "../../Name";
import { CharacterSchema } from "./Character";
import { MediaSchema } from "./Media";
import { StaffSchema } from "./Staff";

/**
 * `StudioSchema` is a constant representing the GraphQL schema for a studio query.
 * It includes the studio's id, name, animation studio status, media, site url, favourite status, and favourites count.
 * @see https://docs.anilist.co/reference/object/studio
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
`;
