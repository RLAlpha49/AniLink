import { type ScoreFormat } from "../../../types/Format";
import { type NotificationType } from "../../../types/Type";
import { type UserStaffNameLanguage } from "../../../types/UserStaffNameLanguage";
import { type UserTitleLanguage } from "../../../types/UserTitleLanguage";
import { type Image } from "../../Image";
import { type Statistics } from "../../Statistics";
import { type UserStats } from "../../UserStats";

/**
 * `UserResponse` is an interface representing the response from a user query.
 * It includes the user's id, name, about, avatar, bannerImage, isFollowing status, isFollower status, isBlocked status, bans, options, mediaListOptions, favourites, statistics, stats, unreadNotificationCount, siteUrl, donatorTier, donatorBadge, moderatorRoles, createdAt, updatedAt, and previousNames.
 * @see https://docs.anilist.co/reference/object/user
 */
export interface UserResponse {
    /**
     * `id` is a number representing the id of the user.
     */
    id: number;

    /**
     * `name` is a string representing the name of the user.
     */
    name: string;

    /**
     * `about` is a string representing the about section of the user.
     */
    about: string;

    /**
     * `avatar` is an instance of `Image` representing the avatar of the user.
     */
    avatar: Image;

    /**
     * `bannerImage` is a string representing the banner image of the user.
     */
    bannerImage: string;

    /**
     * `isFollowing` is a boolean representing whether the user is following.
     */
    isFollowing: boolean;

    /**
     * `isFollower` is a boolean representing whether the user is a follower.
     */
    isFollower: boolean;

    /**
     * `isBlocked` is a boolean representing whether the user is blocked.
     */
    isBlocked: boolean;

    /**
     * `bans` is an array of any representing the bans of the user.
     */
    bans: any[];

    /**
     * `options` is an object representing the options of the user.
     */
    options: {
        /**
         * `titleLanguage` is a string representing the title language of the user.
         */
        titleLanguage: UserTitleLanguage;

        /**
         * `displayAdultContent` is a boolean representing whether the user displays adult content.
         */
        displayAdultContent: boolean;

        /**
         * `airingNotifications` is a boolean representing whether the user has airing notifications.
         */
        airingNotifications: boolean;

        /**
         * `profileColor` is a string representing the profile color of the user.
         */
        profileColor: string;

        /**
         * `notificationOptions` is an array of objects representing the notification options of the user.
         */
        notificationOptions: Array<{
            /**
             * `type` is a string representing the type of the notification option.
             */
            type: NotificationType;

            /**
             * `enabled` is a boolean representing whether the notification option is enabled.
             */
            enabled: boolean;
        }>;

        /**
         * `timezone` is a string representing the timezone of the user.
         */
        timezone: string;

        /**
         * `activityMergeTime` is a number representing the activity merge time of the user.
         */
        activityMergeTime: number;

        /**
         * `staffNameLanguage` is a string representing the staff name language of the user.
         */
        staffNameLanguage: UserStaffNameLanguage;

        /**
         * `restrictMessagesToFollowing` is a boolean representing whether the user restricts messages to following.
         */
        restrictMessagesToFollowing: boolean;

        /**
         * `disabledListActivity` is an array of objects representing the disabled list activity of the user.
         */
        disabledListActivity: Array<{
            /**
             * `disabled` is a boolean representing whether the list activity is disabled.
             */
            disabled: boolean;

            /**
             * `type` is a string representing the type of the list activity.
             */
            type: NotificationType;
        }>;
    };

    /**
     * `mediaListOptions` is an object representing the media list options of the user.
     */
    mediaListOptions: {
        /**
         * `scoreFormat` is a string representing the score format of the media list options.
         */
        scoreFormat: ScoreFormat;

        /**
         * `rowOrder` is a string representing the row order of the media list options.
         */
        rowOrder: string;

        /**
         * `animeList` is an object representing the anime list of the media list options.
         */
        animeList: {
            /**
             * `sectionOrder` is an array of strings representing the section order of the anime list.
             */
            sectionOrder: string[];

            /**
             * `splitCompletedSectionByFormat` is a boolean representing whether the completed section is split by format in the anime list.
             */
            splitCompletedSectionByFormat: boolean;

            /**
             * `customLists` is an array of strings representing the custom lists in the anime list.
             */
            customLists: string[];

            /**
             * `advancedScoring` is an array of strings representing the advanced scoring in the anime list.
             */
            advancedScoring: string[];

            /**
             * `advancedScoringEnabled` is a boolean representing whether advanced scoring is enabled in the anime list.
             */
            advancedScoringEnabled: boolean;
        };

        /**
         * `mangaList` is an object representing the manga list of the media list options.
         */
        mangaList: {
            /**
             * `sectionOrder` is an array of strings representing the section order of the manga list.
             */
            sectionOrder: string[];

            /**
             * `splitCompletedSectionByFormat` is a boolean representing whether the completed section is split by format in the manga list.
             */
            splitCompletedSectionByFormat: boolean;

            /**
             * `customLists` is an array of strings representing the custom lists in the manga list.
             */
            customLists: string[];

            /**
             * `advancedScoring` is an array of strings representing the advanced scoring in the manga list.
             */
            advancedScoring: string[];

            /**
             * `advancedScoringEnabled` is a boolean representing whether advanced scoring is enabled in the manga list.
             */
            advancedScoringEnabled: boolean;
        };
    };

    /**
     * `favourites` is an object representing the favourites of the user.
     */
    favourites: {
        /**
         * `anime` is an array of any representing the favourite anime of the user.
         */
        anime: any[];

        /**
         * `manga` is an array of any representing the favourite manga of the user.
         */
        manga: any[];

        /**
         * `characters` is an array of any representing the favourite characters of the user.
         */
        characters: any[];

        /**
         * `staff` is an array of any representing the favourite staff of the user.
         */
        staff: any[];

        /**
         * `studios` is an array of any representing the favourite studios of the user.
         */
        studios: any[];
    };

    /**
     * `statistics` is an instance of `Statistics` representing the statistics of the user.
     */
    statistics: Statistics;

    /**
     * `stats` is an instance of `UserStats` representing the stats of the user.
     */
    stats: UserStats;

    /**
     * `unreadNotificationCount` is a number representing the unread notification count of the user.
     */
    unreadNotificationCount: number;

    /**
     * `siteUrl` is a string representing the site URL of the user.
     */
    siteUrl: string;

    /**
     * `donatorTier` is a number representing the donator tier of the user.
     */
    donatorTier: number;

    /**
     * `donatorBadge` is a string representing the donator badge of the user.
     */
    donatorBadge: string;

    /**
     * `moderatorRoles` is an array of strings representing the moderator roles of the user.
     */
    moderatorRoles: string[];

    /**
     * `createdAt` is a number representing the timestamp when the user was created.
     */
    createdAt: number;

    /**
     * `updatedAt` is a number representing the timestamp when the user was last updated.
     */
    updatedAt: number;

    /**
     * `previousNames` is an array of objects representing the previous names of the user.
     */
    previousNames: Array<{
        /**
         * `name` is a string representing the previous name of the user.
         */
        name: string;

        /**
         * `createdAt` is a number representing the timestamp when the previous name was created.
         */
        createdAt: number;

        /**
         * `updatedAt` is a number representing the timestamp when the previous name was last updated.
         */
        updatedAt: number;
    }>;
}
