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
 * `CharacterResponse` — a character with their description, name, image, and media appearances.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/character
 */
export interface CharacterResponse {
    /**
     * The id of the character
     */
    id: number;

    /**
     * The names of the character
     */
    name: Name;

    /**
     * Character images
     */
    image: Image;

    /**
     * A general description of the character
     */
    description: string;

    /**
     * The character's gender. Usually Male, Female, or Non-binary but can be any string.
     */
    gender: string;

    /**
     * The character's birth date
     */
    dateOfBirth: FuzzyDate;

    /**
     * The character's age. Note this is a string, not an int, it may contain further text and additional ages.
     */
    age: string;

    /**
     * The characters blood type
     */
    bloodType: string;

    /**
     * If the character is marked as favourite by the currently authenticated user
     */
    isFavourite: boolean;

    /**
     * If the character is blocked from being added to favourites
     */
    isFavouriteBlocked: boolean;

    /**
     * The url for the character page on the AniList website
     */
    siteUrl: string;

    /**
     * Media that includes the character
     */
    media: {
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
     * The amount of user's who have favourited the character
     */
    favourites: number;

    /**
     * Notes for site moderators
     */
    modNotes: string;
}

// @generated-end
