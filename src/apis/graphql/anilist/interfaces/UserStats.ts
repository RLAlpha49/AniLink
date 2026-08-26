/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type ActivityHistory } from "./ActivityHistory";
import { type ScoreDistribution, type StatusDistribution } from "./Distribution";
import { type Favoured } from "./Favoured";
import { type ListScores } from "./ListScores";
/**
 * `UserStats` — a user's aggregate activity stats, distributions, list scores, and favoured overviews.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/userstats
 */
export interface UserStats {
    /**
     * The amount of anime the user has watched in minutes
     */
    watchedTime: number;

    /**
     * The amount of manga chapters the user has read
     */
    chaptersRead: number;

    /**
     * `activityHistory` is a list of `ActivityHistory` entries representing the activity history.
     */
    activityHistory: ActivityHistory[];

    /**
     * `animeStatusDistribution` is a list of `StatusDistribution` entries representing the anime status distribution.
     */
    animeStatusDistribution: StatusDistribution[];

    /**
     * `mangaStatusDistribution` is a list of `StatusDistribution` entries representing the manga status distribution.
     */
    mangaStatusDistribution: StatusDistribution[];

    /**
     * `animeScoreDistribution` is a list of `ScoreDistribution` entries representing the anime score distribution.
     */
    animeScoreDistribution: ScoreDistribution[];

    /**
     * `mangaScoreDistribution` is a list of `ScoreDistribution` entries representing the manga score distribution.
     */
    mangaScoreDistribution: ScoreDistribution[];

    /**
     * `animeListScores` is an instance of `ListScores` representing the anime list scores.
     */
    animeListScores: ListScores;

    /**
     * `mangaListScores` is an instance of `ListScores` representing the manga list scores.
     */
    mangaListScores: ListScores;

    /**
     * `favouredGenresOverview` is a list of `Favoured` entries representing the favoured genres overview.
     */
    favouredGenresOverview: Favoured[];

    /**
     * `favouredGenres` is a list of `Favoured` entries representing the favoured genres.
     */
    favouredGenres: Favoured[];

    /**
     * `favouredTags` is a list of `Favoured` entries representing the favoured tags.
     */
    favouredTags: Favoured[];

    /**
     * `favouredActors` is a list of `Favoured` entries representing the favoured actors.
     */
    favouredActors: Favoured[];

    /**
     * `favouredStaff` is a list of `Favoured` entries representing the favoured staff.
     */
    favouredStaff: Favoured[];

    /**
     * `favouredStudios` is a list of `Favoured` entries representing the favoured studios.
     */
    favouredStudios: Favoured[];

    /**
     * `favouredYears` is a list of `Favoured` entries representing the favoured years.
     */
    favouredYears: Favoured[];

    /**
     * `favouredFormats` is a list of `Favoured` entries representing the favoured formats.
     */
    favouredFormats: Favoured[];
}

// @generated-end
