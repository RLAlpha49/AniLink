import { FuzzyDateSchema } from "../../FuzzyDate";
import { ImageSchema } from "../../Image";
import { NameSchema } from "../../Name";
import { TitleSchema } from "../../Title";

/**
 * `CharacterSchema` is a constant representing the GraphQL schema for a character query.
 * It includes the character's id, name, image, description, gender, date of birth, age, blood type, favourite status, site URL, associated media, number of favourites, and moderator notes.
 * @see https://docs.anilist.co/reference/object/character
 */
export const CharacterSchema = `
  id
  ${NameSchema}
  ${ImageSchema}
  description(asHtml: $asHtml)
  gender
  dateOfBirth {
    ${FuzzyDateSchema}
  }
  age
  bloodType
  isFavourite
  isFavouriteBlocked
  siteUrl
  media(sort: $mediaSort, onList: $mediaOnList, page: $mediaPage, perPage: $mediaPerPage) {
    nodes {
      id
      ${TitleSchema}
    }
  }
  favourites
  modNotes
`;
