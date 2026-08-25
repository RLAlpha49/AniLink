/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type FuzzyDate } from "../../FuzzyDate";
import { type Image } from "../../Image";
import { type Name } from "../../Name";
/**
 * `StaffResponse` — a staff member with their roles, characters, and media connections.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/staff
 */
export interface StaffResponse {
    /**
     * The id of the staff member
     */
    id: number;

    /**
     * The names of the staff member
     */
    name: Name;

    /**
     * The primary language of the staff member. Current values: Japanese, English, Korean, Italian, Spanish, Portuguese, French, German, Hebrew, Hungarian, Chinese, Arabic, Filipino, Catalan, Finnish, Turkish, Dutch, Swedish, Thai, Tagalog, Malaysian, Indonesian, Vietnamese, Nepali, Hindi, Urdu
     */
    languageV2: string;

    /**
     * The staff images
     */
    image: Image;

    /**
     * A general description of the staff member
     */
    description: string;

    /**
     * The person's primary occupations
     */
    primaryOccupations: string[];

    /**
     * The staff's gender. Usually Male, Female, or Non-binary but can be any string.
     */
    gender: string;

    /**
     * `dateOfBirth` is an instance of `FuzzyDate` representing the date of birth.
     */
    dateOfBirth: FuzzyDate;

    /**
     * `dateOfDeath` is an instance of `FuzzyDate` representing the date of death.
     */
    dateOfDeath: FuzzyDate;

    /**
     * The person's age in years
     */
    age: number;

    /**
     * [startYear, endYear] (If the 2nd value is not present staff is still active)
     */
    yearsActive: number[];

    /**
     * The persons birthplace or hometown
     */
    homeTown: string;

    /**
     * The persons blood type
     */
    bloodType: string;

    /**
     * If the staff member is marked as favourite by the currently authenticated user
     */
    isFavourite: boolean;

    /**
     * If the staff member is blocked from being added to favourites
     */
    isFavouriteBlocked: boolean;

    /**
     * The url for the staff page on the AniList website
     */
    siteUrl: string;

    /**
     * Media where the staff member has a production role
     */
    staffMedia: {
        /**
         * `nodes` is a list of `Media` entries representing the nodes.
         */
        nodes: Array<{
            /**
             * The id of the media
             */
            id: number;

            /**
             * The official titles of the media in various languages
             */
            title: {
                /**
                 * The romanization of the native language title
                 */
                romaji: string;

                /**
                 * The official english title
                 */
                english: string;

                /**
                 * Official title in it's native language
                 */
                native: string;

                /**
                 * The currently authenticated users preferred title language. Default romaji for non-authenticated
                 */
                userPreferred: string;
            };
        }>;
    };

    /**
     * Characters voiced by the actor
     */
    characters: {
        /**
         * `nodes` is a list of `Character` entries representing the nodes.
         */
        nodes: Array<{
            /**
             * The id of the character
             */
            id: number;

            /**
             * The names of the character
             */
            name: {
                /**
                 * The character's given name
                 */
                first: string;

                /**
                 * The character's surname
                 */
                last: string;

                /**
                 * The character's first and last name
                 */
                full: string;

                /**
                 * The character's full name in their native language
                 */
                native: string;
            };
        }>;
    };

    /**
     * Media the actor voiced characters in. (Same data as characters with media as node instead of characters)
     */
    characterMedia: {
        /**
         * `nodes` is a list of `Media` entries representing the nodes.
         */
        nodes: Array<{
            /**
             * The id of the media
             */
            id: number;

            /**
             * The official titles of the media in various languages
             */
            title: {
                /**
                 * The romanization of the native language title
                 */
                romaji: string;

                /**
                 * The official english title
                 */
                english: string;

                /**
                 * Official title in it's native language
                 */
                native: string;

                /**
                 * The currently authenticated users preferred title language. Default romaji for non-authenticated
                 */
                userPreferred: string;
            };
        }>;
    };

    /**
     * Submitter for the submission
     */
    submitter: {
        /**
         * The id of the user
         */
        id: number;

        /**
         * The name of the user
         */
        name: string;
    };

    /**
     * Status of the submission
     */
    submissionStatus?: number;

    /**
     * Inner details of submission status
     */
    submissionNotes?: string;

    /**
     * The amount of user's who have favourited the staff member
     */
    favourites?: number;

    /**
     * Notes for site moderators
     */
    modNotes?: string;
}

// @generated-end
