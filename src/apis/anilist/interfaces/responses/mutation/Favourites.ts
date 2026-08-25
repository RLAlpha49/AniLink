/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `Favourites` — the collections of a user's favourite anime, manga, characters, staff, and studios.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/favourites
 */
export interface Favourites {
    /**
     * Favourite anime
     */
    anime: {
        /**
         * `edges` is a list of `MediaEdge` entries representing the edges.
         */
        edges: Array<{
            /**
             * The id of the connection
             */
            id: number;

            /**
             * `node` is an instance of `Media` representing the node.
             */
            node: {
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
            };
        }>;

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
     * Favourite manga
     */
    manga: {
        /**
         * `edges` is a list of `MediaEdge` entries representing the edges.
         */
        edges: Array<{
            /**
             * The id of the connection
             */
            id: number;

            /**
             * `node` is an instance of `Media` representing the node.
             */
            node: {
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
            };
        }>;

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
     * Favourite characters
     */
    characters: {
        /**
         * `edges` is a list of `CharacterEdge` entries representing the edges.
         */
        edges: Array<{
            /**
             * The id of the connection
             */
            id: number;

            /**
             * `node` is an instance of `Character` representing the node.
             */
            node: {
                /**
                 * The id of the character
                 */
                id: number;

                /**
                 * The names of the character
                 */
                name: {
                    /**
                     * The character's first and last name
                     */
                    full: string;
                };
            };
        }>;

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
                 * The character's first and last name
                 */
                full: string;
            };
        }>;
    };

    /**
     * Favourite staff
     */
    staff: {
        /**
         * `edges` is a list of `StaffEdge` entries representing the edges.
         */
        edges: Array<{
            /**
             * The id of the connection
             */
            id: number;

            /**
             * `node` is an instance of `Staff` representing the node.
             */
            node: {
                /**
                 * The id of the staff member
                 */
                id: number;

                /**
                 * The names of the staff member
                 */
                name: {
                    /**
                     * The person's first and last name
                     */
                    full: string;
                };
            };
        }>;

        /**
         * `nodes` is a list of `Staff` entries representing the nodes.
         */
        nodes: Array<{
            /**
             * The id of the staff member
             */
            id: number;

            /**
             * The names of the staff member
             */
            name: {
                /**
                 * The person's first and last name
                 */
                full: string;
            };
        }>;
    };

    /**
     * Favourite studios
     */
    studios: {
        /**
         * `edges` is a list of `StudioEdge` entries representing the edges.
         */
        edges: Array<{
            /**
             * The id of the connection
             */
            id: number;

            /**
             * `node` is an instance of `Studio` representing the node.
             */
            node: {
                /**
                 * The id of the studio
                 */
                id: number;

                /**
                 * The name of the studio
                 */
                name: string;
            };
        }>;

        /**
         * `nodes` is a list of `Studio` entries representing the nodes.
         */
        nodes: Array<{
            /**
             * The id of the studio
             */
            id: number;

            /**
             * The name of the studio
             */
            name: string;
        }>;
    };
}

// @generated-end
