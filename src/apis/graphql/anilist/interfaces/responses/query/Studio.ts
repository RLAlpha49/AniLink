/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type Media } from "../../Media";
import { type CharacterResponse } from "./Character";
import { type StaffResponse } from "./Staff";
/**
 * `StudioResponse` — a studio with its produced media connections.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/studio
 */
export interface StudioResponse {
    /**
     * The id of the studio
     */
    id: number;

    /**
     * The name of the studio
     */
    name: string;

    /**
     * If the studio is an animation studio or a different kind of company
     */
    isAnimationStudio: boolean;

    /**
     * The media the studio has worked on
     */
    media: {
        /**
         * `edges` is a list of `MediaEdge` entries representing the edges.
         */
        edges: Array<{
            /**
             * The id of the connection
             */
            id: number;

            /**
             * The type of relation to the parent model
             */
            relationType: string;

            /**
             * If the studio is the main animation studio of the media (For Studio->MediaConnection field only)
             */
            isMainStudio: boolean;

            /**
             * The characters in the media voiced by the parent actor
             */
            characters: CharacterResponse[];

            /**
             * The characters role in the media
             */
            characterRole: string;

            /**
             * Media specific character name
             */
            characterName: string;

            /**
             * Notes regarding the VA's role for the character
             */
            roleNotes: string;

            /**
             * Used for grouping roles where multiple dubs exist for the same language. Either dubbing company name or language variant.
             */
            dubGroup: string;

            /**
             * The voice actors of the character
             */
            voiceActors: StaffResponse[];

            /**
             * The voice actors of the character with role date
             */
            voiceActorRoles: Array<{
                /**
                 * The voice actors of the character
                 */
                voiceActor: {
                    /**
                     * The id of the staff member
                     */
                    id: number;

                    /**
                     * The names of the staff member
                     */
                    name: {
                        /**
                         * The person's given name
                         */
                        first: string;

                        /**
                         * The person's surname
                         */
                        last: string;

                        /**
                         * The person's first and last name
                         */
                        full: string;

                        /**
                         * The person's full name in their native language
                         */
                        native: string;
                    };

                    /**
                     * The staff images
                     */
                    image: {
                        /**
                         * The person's image of media at its largest size
                         */
                        large: string;

                        /**
                         * The person's image of media at medium size
                         */
                        medium: string;
                    };
                };

                /**
                 * Notes regarding the VA's role for the character
                 */
                roleNotes: string;

                /**
                 * Used for grouping roles where multiple dubs exist for the same language. Either dubbing company name or language variant.
                 */
                dubGroup: string;
            }>;

            /**
             * The order the media should be displayed from the users favourites
             */
            favouriteOrder: number;

            /**
             * `node` is an instance of `Media` representing the node.
             */
            node: Media;
        }>;

        /**
         * `nodes` is a list of `Media` entries representing the nodes.
         */
        nodes: Media[];

        /**
         * The pagination information
         */
        pageInfo: {
            /**
             * The total number of items. Note: This value is not guaranteed to be accurate, do not rely on this for logic
             */
            total: number;

            /**
             * The count on a page
             */
            perPage: number;

            /**
             * The current page
             */
            currentPage: number;

            /**
             * The last page
             */
            lastPage: number;

            /**
             * If there is another page
             */
            hasNextPage: boolean;
        };
    };

    /**
     * The url for the studio page on the AniList website
     */
    siteUrl: string;

    /**
     * If the studio is marked as favourite by the currently authenticated user
     */
    isFavourite: boolean;

    /**
     * The amount of user's who have favourited the studio
     */
    favourites: number;
}

// @generated-end
