/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type CoverImage } from "./CoverImage";
import { type ExternalLink } from "./ExternalLink";
import { type FuzzyDate } from "./FuzzyDate";
import { type MediaStats } from "./MediaStats";
import { type NextAiringEpisode } from "./NextAiringEpisode";
import { type Ranking } from "./Ranking";
import { type StreamingEpisode } from "./StreamingEpisode";
import { type Tag } from "./Tag";
import { type Title } from "./Title";
import { type Trailer } from "./Trailer";
/**
 * `MediaListEntry` — the viewer's list entry for a media.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export interface MediaListEntry {
    /**
     * The id of the list entry
     */
    id: number;

    /**
     * The watching/reading status
     */
    status: string;
}

/**
 * `Media` — a media entity without relation connections.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/media
 */
export interface Media {
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
    type: string;

    /**
     * The format the media was released in
     */
    format: string;

    /**
     * The current releasing status of the media
     */
    status: string;

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
    season: string;

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
    source: string;

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
