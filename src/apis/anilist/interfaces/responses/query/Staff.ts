import { type Name } from "../../Name";
import { type Image } from "../../Image";
import { type FuzzyDate } from "../../FuzzyDate";
import { type Title } from "../../Title";

/**
 * `StaffResponse` is an interface representing the response from a staff query.
 * It includes the staff's id, name, language, image, description, primary occupations, gender, date of birth, date of death, age, years active, hometown, blood type, favourite status, favourite blocked status, site url, staff media, characters, character media, staff, submitter, submission status, submission notes, favourites, and mod notes.
 * @see https://docs.anilist.co/reference/object/staff
 */
export interface StaffResponse {
    /**
     * `id` is a number representing the id of the staff.
     */
    id: number;

    /**
     * `name` is an instance of `Name` representing the name of the staff.
     */
    name: Name;

    /**
     * `languageV2` is a string representing the language of the staff.
     */
    languageV2: string;

    /**
     * `image` is an instance of `Image` representing the image of the staff.
     */
    image: Image;

    /**
     * `description` is a string representing the description of the staff.
     */
    description: string;

    /**
     * `primaryOccupations` is an array of strings representing the primary occupations of the staff.
     */
    primaryOccupations: string[];

    /**
     * `gender` is a string representing the gender of the staff.
     */
    gender: string;

    /**
     * `dateOfBirth` is an instance of `FuzzyDate` representing the date of birth of the staff.
     */
    dateOfBirth: FuzzyDate;

    /**
     * `dateOfDeath` is an instance of `FuzzyDate` representing the date of death of the staff.
     */
    dateOfDeath: FuzzyDate;

    /**
     * `age` is a number representing the age of the staff.
     */
    age: number;

    /**
     * `yearsActive` is an array of numbers representing the years the staff has been active.
     */
    yearsActive: number[];

    /**
     * `homeTown` is a string representing the hometown of the staff.
     */
    homeTown: string;

    /**
     * `bloodType` is a string representing the blood type of the staff.
     */
    bloodType: string;

    /**
     * `isFavourite` is a boolean indicating whether the staff is a favourite.
     */
    isFavourite: boolean;

    /**
     * `isFavouriteBlocked` is a boolean indicating whether the favourite status of the staff is blocked.
     */
    isFavouriteBlocked: boolean;

    /**
     * `siteUrl` is a string representing the URL of the staff on the site.
     */
    siteUrl: string;

    /**
     * `staffMedia` is an object representing the media associated with the staff.
     * It includes an array of `nodes` each representing a media node with its own properties.
     */
    staffMedia: {
        nodes: Array<{
            /**
             * `id` is a number representing the id of the media node.
             */
            id: number;

            /**
             * `title` is an instance of `Title` representing the title of the media node.
             */
            title: Title;
        }>;
    };

    /**
     * `characters` is an object representing the characters associated with the staff.
     * It includes an array of `nodes` each representing a character node with its own properties.
     */
    characters: {
        nodes: Array<{
            /**
             * `id` is a number representing the id of the character node.
             */
            id: number;

            /**
             * `name` is an instance of `Name` representing the name of the character node.
             */
            name: Name;
        }>;
    };

    /**
     * `characterMedia` is an object representing the media associated with the characters of the staff.
     * It includes an array of `nodes` each representing a media node with its own properties.
     */
    characterMedia: {
        nodes: Array<{
            /**
             * `id` is a number representing the id of the media node.
             */
            id: number;

            /**
             * `title` is an instance of `Title` representing the title of the media node.
             */
            title: Title;
        }>;
    };

    /**
     * `submitter` is an object representing the submitter of the staff response.
     * It includes the submitter's id and name.
     */
    submitter: {
        /**
         * `id` is a number representing the id of the submitter.
         */
        id: number;

        /**
         * `name` is an instance of `Name` representing the name of the submitter,
         * matching the user name sub-selection used by the query.
         */
        name: Name;
    };

    /**
     * `submissionStatus` is a number representing the submission status of the staff response.
     * It is only returned to users with moderator permissions.
     */
    submissionStatus?: number;

    /**
     * `submissionNotes` is a string representing the submission notes of the staff response.
     * It is only returned to users with moderator permissions.
     */
    submissionNotes?: string;

    /**
     * `favourites` is a number representing the count of favourites for the staff.
     * It requires authentication.
     */
    favourites?: number;

    /**
     * `modNotes` is a string representing the mod notes for the staff.
     * It is only returned to users with moderator permissions.
     */
    modNotes?: string;
}
