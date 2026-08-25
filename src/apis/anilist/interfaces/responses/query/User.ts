/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type ScoreFormat } from "../../../types/Format";
import { type NotificationType } from "../../../types/Type";
import { type UserStaffNameLanguage } from "../../../types/UserStaffNameLanguage";
import { type UserTitleLanguage } from "../../../types/UserTitleLanguage";
import { type Statistics } from "../../Statistics";
import { type UserStats } from "../../UserStats";
/**
 * `UserResponse` — a user with their options, list settings, favourites, statistics, and activity stats.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/user
 */
export interface UserResponse {
    /**
     * The id of the user
     */
    id: number;

    /**
     * The name of the user
     */
    name: string;

    /**
     * The bio written by user (Markdown)
     */
    about: string;

    /**
     * The user's avatar images
     */
    avatar: {
        /**
         * The avatar of user at its largest size
         */
        large: string;

        /**
         * The avatar of user at medium size
         */
        medium: string;
    };

    /**
     * The user's banner images
     */
    bannerImage: string;

    /**
     * If the authenticated user if following this user
     */
    isFollowing: boolean;

    /**
     * If this user if following the authenticated user
     */
    isFollower: boolean;

    /**
     * If the user is blocked by the authenticated user
     */
    isBlocked: boolean;

    /**
     * List of active bans. Mod-only
     */
    bans: string[];

    /**
     * The user's general options
     */
    options: {
        /**
         * The language the user wants to see media titles in
         */
        titleLanguage: UserTitleLanguage;

        /**
         * Whether the user has enabled viewing of 18+ content
         */
        displayAdultContent: boolean;

        /**
         * Whether the user receives notifications when a show they are watching aires
         */
        airingNotifications: boolean;

        /**
         * Profile highlight color (blue, purple, pink, orange, red, green, gray)
         */
        profileColor: string;

        /**
         * Notification options
         */
        notificationOptions: Array<{
            /**
             * The type of notification
             */
            type: NotificationType;

            /**
             * Whether this type of notification is enabled
             */
            enabled: boolean;
        }>;

        /**
         * The user's timezone offset (Auth user only)
         */
        timezone: string;

        /**
         * Minutes between activity for them to be merged together. 0 is Never, Above 2 weeks (20160 mins) is Always.
         */
        activityMergeTime: number;

        /**
         * The language the user wants to see staff and character names in
         */
        staffNameLanguage: UserStaffNameLanguage;

        /**
         * Whether the user only allow messages from users they follow
         */
        restrictMessagesToFollowing: boolean;

        /**
         * The list activity types the user has disabled from being created from list updates
         */
        disabledListActivity: Array<{
            /**
             * `disabled` is a boolean value representing the disabled.
             */
            disabled: boolean;

            /**
             * `type` is a NotificationType value representing the type.
             */
            type: NotificationType;
        }>;
    };

    /**
     * The user's media list options
     */
    mediaListOptions: {
        /**
         * The score format the user is using for media lists
         */
        scoreFormat: ScoreFormat;

        /**
         * The default order list rows should be displayed in
         */
        rowOrder: string;

        /**
         * The user's anime list options
         */
        animeList: {
            /**
             * The order each list should be displayed in
             */
            sectionOrder: string[];

            /**
             * If the completed sections of the list should be separated by format
             */
            splitCompletedSectionByFormat: boolean;

            /**
             * The names of the user's custom lists
             */
            customLists: string[];

            /**
             * The names of the user's advanced scoring sections
             */
            advancedScoring: string[];

            /**
             * If advanced scoring is enabled
             */
            advancedScoringEnabled: boolean;
        };

        /**
         * The user's manga list options
         */
        mangaList: {
            /**
             * The order each list should be displayed in
             */
            sectionOrder: string[];

            /**
             * If the completed sections of the list should be separated by format
             */
            splitCompletedSectionByFormat: boolean;

            /**
             * The names of the user's custom lists
             */
            customLists: string[];

            /**
             * The names of the user's advanced scoring sections
             */
            advancedScoring: string[];

            /**
             * If advanced scoring is enabled
             */
            advancedScoringEnabled: boolean;
        };
    };

    /**
     * The users favourites
     */
    favourites: {
        /**
         * Favourite anime
         */
        anime: {
            /**
             * `edges` is a list of `MediaEdge` entries representing the edges.
             */
            edges: Array<{
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
        characters: unknown[];

        /**
         * Favourite staff
         */
        staff: unknown[];

        /**
         * Favourite studios
         */
        studios: unknown[];
    };

    /**
     * The users anime & manga list statistics
     */
    statistics: Statistics;

    /**
     * The user's statistics
     */
    stats: UserStats;

    /**
     * The number of unread notifications the user has
     */
    unreadNotificationCount: number;

    /**
     * The url for the user page on the AniList website
     */
    siteUrl: string;

    /**
     * The donation tier of the user
     */
    donatorTier: number;

    /**
     * Custom donation badge text
     */
    donatorBadge: string;

    /**
     * The user's moderator roles if they are a site moderator
     */
    moderatorRoles: string[];

    /**
     * When the user's account was created. (Does not exist for accounts created before 2020)
     */
    createdAt: number;

    /**
     * When the user's data was last updated
     */
    updatedAt: number;

    /**
     * The user's previously used names.
     */
    previousNames: Array<{
        /**
         * A previous name of the user.
         */
        name: string;

        /**
         * When the user first changed from this name.
         */
        createdAt: number;

        /**
         * When the user most recently changed from this name.
         */
        updatedAt: number;
    }>;
}

// @generated-end
