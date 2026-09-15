import { FuzzyDateSchema } from "../../FuzzyDate";
import { ImageSchema } from "../../Image";
import { NameSchema } from "../../Name";
import { TitleSchema } from "../../Title";

/**
 * {@link CharacterSchema} is the character response selection: identity, biography, and
 * the media the character appears in. The character queries send it, and the staff and
 * studio fragments interpolate it for their `characters` fields.
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
