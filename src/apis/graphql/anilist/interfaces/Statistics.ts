/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type MediaStatistics } from "./MediaStatistics";
/**
 * `Statistics` — a user's anime and manga usage statistics.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/userstatistictypes
 */
export interface Statistics {
    /**
     * `anime` is an instance of `MediaStatistics` representing the anime.
     */
    anime: MediaStatistics;

    /**
     * `manga` is an instance of `MediaStatistics` representing the manga.
     */
    manga: MediaStatistics;
}

// @generated-end
