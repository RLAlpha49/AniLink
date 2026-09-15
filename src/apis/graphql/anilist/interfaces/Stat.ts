import { type Tag } from "./Tag";
import { type Staff } from "./Staff";
import { type Studio } from "./Studio";

/**
 * {@link Stat} is one row of a user's per-category media statistics: how many entries of
 * one format, status, score, length, year, genre, tag, country, voice actor, staff
 * member, or studio the user has, with the mean score. It is the superset union of
 * AniList's per-category `User*Statistic` rows, so only the field matching the row's
 * category is present. `MediaStatistics` uses it for every breakdown field.
 * @see https://docs.anilist.co/reference/object/userstatistics
 */
export interface Stat {
    /**
     * How many entries the row covers.
     */
    count: number;

    /**
     * The mean score across the row's entries.
     */
    meanScore: number;

    /**
     * The minutes watched across the row's entries (anime statistics only).
     */
    minutesWatched?: number;

    /**
     * The chapters read across the row's entries (manga statistics only).
     */
    chaptersRead?: number;

    /**
     * The ids of the media the row covers.
     */
    mediaIds: number[];

    /**
     * The format this row counts, on format rows.
     */
    format?: string;

    /**
     * The status this row counts, on status rows.
     */
    status?: string;

    /**
     * The score this row counts, on score rows.
     */
    score?: number;

    /**
     * The length bucket this row counts, on length rows.
     */
    length?: number;

    /**
     * The release year this row counts, on release-year rows.
     */
    releaseYear?: number;

    /**
     * The start year this row counts, on start-year rows.
     */
    startYear?: number;

    /**
     * The genre this row counts, on genre rows.
     */
    genre?: string;

    /**
     * The tag this row counts, on tag rows.
     */
    tag?: Tag;

    /**
     * The country this row counts, on country rows.
     */
    country?: string;

    /**
     * The voice actor this row counts, on voice-actor rows.
     */
    voiceActor?: Staff;

    /**
     * The characters voiced by the row's voice actor, on voice-actor rows.
     */
    characterIds?: number[];

    /**
     * The staff member this row counts, on staff rows.
     */
    staff?: Staff;

    /**
     * The studio this row counts, on studio rows.
     */
    studio?: Studio;
}
