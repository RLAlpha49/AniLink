import { type Tag } from "./Tag";
import { type Staff } from "./Staff";
import { type Studio } from "./Studio";

/**
 * {@link Favoured} is one row of a user's favoured-entity overviews: how much of a genre,
 * tag, staff member, studio, year, or format the user consumed, with the mean score.
 * It is the superset union of AniList's per-category stat rows (GenreStats, TagStats,
 * …), so only the field matching the row's category is present.
 * @see https://docs.anilist.co/reference/object/userstats
 */
export interface Favoured {
    /**
     * The genre this row counts, on genre rows.
     */
    genre?: string;

    /**
     * How many entries the row covers.
     */
    amount: number;

    /**
     * The mean score across the row's entries.
     */
    meanScore: number;

    /**
     * The minutes watched across the row's entries (anime categories only).
     */
    timeWatched: number;

    /**
     * The tag this row counts, on tag rows.
     */
    tag?: Tag;

    /**
     * The staff member this row counts, on staff/actor rows.
     */
    staff?: Staff;

    /**
     * The studio this row counts, on studio rows.
     */
    studio?: Studio;

    /**
     * The year this row counts, on year rows.
     */
    year?: number;

    /**
     * The format this row counts, on format rows.
     */
    format?: string;
}
