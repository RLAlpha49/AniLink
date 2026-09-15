import { FuzzyDateSchema } from "../../FuzzyDate";
import { ImageSchema } from "../../Image";
import { NameSchema } from "../../Name";
import { TitleSchema } from "../../Title";

/**
 * {@link StaffSchema} is the staff response selection: identity, biography, and the
 * media/characters the person worked on. The staff queries send it, and the studio
 * fragment interpolates it for its `staff` field.
 * @see https://docs.anilist.co/reference/object/staff
 */
export const StaffSchema = `
  id
  ${NameSchema}
  languageV2
  ${ImageSchema}
  description(asHtml: $asHtml)
  primaryOccupations
  gender
  dateOfBirth {
    ${FuzzyDateSchema}
  }
  dateOfDeath {
    ${FuzzyDateSchema}
  }
  age
  yearsActive
  homeTown
  bloodType
  isFavourite
  isFavouriteBlocked
  siteUrl
  staffMedia (sort: $staffMediaSort, type: $staffMediaType, onList: $staffMediaOnList, page: $staffMediaPage, perPage: $staffMediaPerPage) {
    nodes {
      id
      ${TitleSchema}
    }
  }
  characters (sort: $charactersSort, page: $charactersPage, perPage: $charactersPerPage) {
    nodes {
      id
      ${NameSchema}
    }
  }
  characterMedia (sort: $characterMediaSort, onList: $characterMediaOnList, page: $characterMediaPage, perPage: $characterMediaPerPage) {
    nodes {
      id
      ${TitleSchema}
    }
  }
  submitter {
    id
    name
  }
  submissionStatus
  submissionNotes
  favourites
  modNotes
`;
