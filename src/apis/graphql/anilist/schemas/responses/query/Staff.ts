import { FuzzyDateSchema } from "../../FuzzyDate";
import { ImageSchema } from "../../Image";
import { NameSchema } from "../../Name";
import { TitleSchema } from "../../Title";

/**
 * {@link StaffSchema} is a constant representing the GraphQL schema for a staff query.
 * It includes the staff's id, name, language, image, description, primary occupations, gender, date of birth, date of death, age, years active, hometown, blood type, favourite status, favourite blocked status, site url, staff media, characters, character media, staff, submitter, submission status, submission notes, favourites, and mod notes.
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
