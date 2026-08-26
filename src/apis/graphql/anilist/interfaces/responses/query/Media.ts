/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type MediaFormat } from "../../../types/Format";
import { type MediaSeason } from "../../../types/Season";
import { type MediaSource } from "../../../types/Source";
import { type MediaStatus } from "../../../types/Status";
import { type MediaType } from "../../../types/Type";
import { type CoverImage } from "../../CoverImage";
import { type ExternalLink } from "../../ExternalLink";
import { type FuzzyDate } from "../../FuzzyDate";
import { type MediaListEntry } from "../../Media";
import { type MediaStats } from "../../MediaStats";
import { type NextAiringEpisode } from "../../NextAiringEpisode";
import { type Ranking } from "../../Ranking";
import { type StreamingEpisode } from "../../StreamingEpisode";
import { type Tag } from "../../Tag";
import { type Title } from "../../Title";
import { type Trailer } from "../../Trailer";
/**
 * `MediaResponse` — the full media entity including relation, character, staff, and studio connections.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/media
 */
export interface MediaResponse {
    /**
     * The id of the media
     */
    id: number;

    /**
     * The mal id of the media
     */
    idMal: number;

    /**
     * The official titles of the media in various languages
     */
    title: Title;

    /**
     * The type of the media; anime or manga
     */
    type: MediaType;

    /**
     * The format the media was released in
     */
    format: MediaFormat;

    /**
     * The current releasing status of the media
     */
    status: MediaStatus;

    /**
     * Short description of the media's story and characters
     */
    description: string;

    /**
     * The first official release date of the media
     */
    startDate: FuzzyDate;

    /**
     * The last official release date of the media
     */
    endDate: FuzzyDate;

    /**
     * The season the media was initially released in
     */
    season: MediaSeason;

    /**
     * The season year the media was initially released in
     */
    seasonYear: number;

    /**
     * The year & season the media was initially released in
     */
    seasonInt: number;

    /**
     * The amount of episodes the anime has when complete
     */
    episodes?: number;

    /**
     * The general length of each anime episode in minutes
     */
    duration?: number;

    /**
     * The amount of chapters the manga has when complete
     */
    chapters?: number;

    /**
     * The amount of volumes the manga has when complete
     */
    volumes?: number;

    /**
     * Where the media was created. (ISO 3166-1 alpha-2)
     */
    countryOfOrigin: string;

    /**
     * If the media is officially licensed or a self-published doujin release
     */
    isLicensed: boolean;

    /**
     * Source type the media was adapted from.
     */
    source: MediaSource;

    /**
     * Official Twitter hashtags for the media
     */
    hashtag: string;

    /**
     * Media trailer or advertisement
     */
    trailer: Trailer;

    /**
     * When the media's data was last updated
     */
    updatedAt: number;

    /**
     * The cover images of the media
     */
    coverImage: CoverImage;

    /**
     * The banner image of the media
     */
    bannerImage: string;

    /**
     * The genres of the media
     */
    genres: string[];

    /**
     * Alternative titles of the media
     */
    synonyms: string[];

    /**
     * A weighted average score of all the user's scores of the media
     */
    averageScore: number;

    /**
     * Mean score of all the user's scores of the media
     */
    meanScore: number;

    /**
     * The number of users with the media on their list
     */
    popularity: number;

    /**
     * Locked media may not be added to lists our favorited. This may be due to the entry pending for deletion or other reasons.
     */
    isLocked: boolean;

    /**
     * The amount of related activity in the past hour
     */
    trending: number;

    /**
     * The amount of user's who have favourited the media
     */
    favourites: number;

    /**
     * List of tags that describes elements and themes of the media
     */
    tags: Tag[];

    /**
     * Other media in the same or connecting franchise
     */
    relations: {
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
            characters: Array<{
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

                /**
                 * Character images
                 */
                image: {
                    /**
                     * The character's image of media at its largest size
                     */
                    large: string;

                    /**
                     * The character's image of media at medium size
                     */
                    medium: string;
                };

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
                 * The amount of user's who have favourited the character
                 */
                favourites: number;

                /**
                 * Notes for site moderators
                 */
                modNotes: string;
            }>;

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
             * The role of the staff member in the production of the media
             */
            staffRole: string;

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
    };

    /**
     * The characters in the media
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
             * The characters role in the media
             */
            role: string;

            /**
             * Media specific character name
             */
            name: string;

            /**
             * The voice actors of the character
             */
            voiceActors: Array<{
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
            }>;

            /**
             * The media the character is in
             */
            media: Array<{
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

                /**
                 * The cover images of the media
                 */
                coverImage: {
                    /**
                     * The cover image url of the media at its largest size. If this size isn't available, large will be provided instead.
                     */
                    extraLarge: string;

                    /**
                     * The cover image url of the media at a large size
                     */
                    large: string;

                    /**
                     * The cover image url of the media at medium size
                     */
                    medium: string;

                    /**
                     * Average #hex color of cover image
                     */
                    color: string;
                };
            }>;

            /**
             * The order the character should be displayed from the users favourites
             */
            favouriteOrder: number;

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

                /**
                 * Character images
                 */
                image: {
                    /**
                     * The character's image of media at its largest size
                     */
                    large: string;

                    /**
                     * The character's image of media at medium size
                     */
                    medium: string;
                };
            };
        }>;
    };

    /**
     * The staff who produced the media
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
             * The role of the staff member in the production of the media
             */
            role: string;

            /**
             * The order the staff should be displayed from the users favourites
             */
            favouriteOrder: number;

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
        }>;
    };

    /**
     * The companies who produced the media
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
             * If the studio is the main animation studio of the anime
             */
            isMain: boolean;

            /**
             * The order the character should be displayed from the users favourites
             */
            favouriteOrder: number;

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

                /**
                 * If the studio is an animation studio or a different kind of company
                 */
                isAnimationStudio: boolean;

                /**
                 * The url for the studio page on the AniList website
                 */
                siteUrl: string;
            };
        }>;
    };

    /**
     * If the media is marked as favourite by the current authenticated user
     */
    isFavourite: boolean;

    /**
     * If the media is intended only for 18+ adult audiences
     */
    isAdult: boolean;

    /**
     * The media's next episode airing schedule
     */
    nextAiringEpisode: NextAiringEpisode;

    /**
     * External links to another site related to the media
     */
    externalLinks: ExternalLink[];

    /**
     * Data and links to legal streaming episodes on external sites
     */
    streamingEpisodes: StreamingEpisode[];

    /**
     * The ranking of the media in a particular time span and format compared to other media
     */
    rankings: Ranking[];

    /**
     * The authenticated user's media list entry for the media
     */
    mediaListEntry: MediaListEntry;

    /**
     * `stats` is an instance of `MediaStats` representing the stats.
     */
    stats: MediaStats;

    /**
     * The url for the media page on the AniList website
     */
    siteUrl: string;

    /**
     * If the media should have forum thread automatically created for it on airing episode release
     */
    autoCreateForumThread: boolean;

    /**
     * If the media is blocked from being recommended to/from
     */
    isRecommendationBlocked: boolean;

    /**
     * Notes for site moderators
     */
    modNotes: string;
}

// @generated-end
