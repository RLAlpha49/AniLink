/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type Stat } from "./Stat";
/**
 * `MediaStatistics` — the per-media-type usage statistics of a user.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/userstatistics
 */
export interface MediaStatistics {
    /**
     * `count` is a number value representing the count.
     */
    count: number;

    /**
     * `meanScore` is a number value representing the mean score.
     */
    meanScore: number;

    /**
     * `standardDeviation` is a number value representing the standard deviation.
     */
    standardDeviation: number;

    /**
     * `minutesWatched` is a number value representing the minutes watched.
     */
    minutesWatched?: number;

    /**
     * `episodesWatched` is a number value representing the episodes watched.
     */
    episodesWatched?: number;

    /**
     * `formats` is a list of `Stat` entries representing the formats.
     */
    formats: Stat[];

    /**
     * `statuses` is a list of `Stat` entries representing the statuses.
     */
    statuses: Stat[];

    /**
     * `scores` is a list of `Stat` entries representing the scores.
     */
    scores: Stat[];

    /**
     * `lengths` is a list of `Stat` entries representing the lengths.
     */
    lengths: Stat[];

    /**
     * `releaseYears` is a list of `Stat` entries representing the release years.
     */
    releaseYears: Stat[];

    /**
     * `startYears` is a list of `Stat` entries representing the start years.
     */
    startYears: Stat[];

    /**
     * `genres` is a list of `Stat` entries representing the genres.
     */
    genres: Stat[];

    /**
     * `tags` is a list of `Stat` entries representing the tags.
     */
    tags: Stat[];

    /**
     * `countries` is a list of `Stat` entries representing the countries.
     */
    countries: Stat[];

    /**
     * `voiceActors` is a list of `Stat` entries representing the voice actors.
     */
    voiceActors: Stat[];

    /**
     * `staff` is a list of `Stat` entries representing the staff.
     */
    staff: Stat[];

    /**
     * `studios` is a list of `Stat` entries representing the studios.
     */
    studios: Stat[];

    /**
     * `chaptersRead` is a number value representing the chapters read.
     */
    chaptersRead?: number;

    /**
     * `volumesRead` is a number value representing the volumes read.
     */
    volumesRead?: number;
}

// @generated-end
