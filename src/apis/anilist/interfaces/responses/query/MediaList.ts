/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type FuzzyDate } from "../../FuzzyDate";
import { type Media } from "../../Media";
/**
 * `MediaListResponse` — a user's list entry for a media, including the media itself.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export interface MediaListResponse {
    /**
     * The id of the list entry
     */
    id: number;

    /**
     * The id of the user owner of the list entry
     */
    userId: number;

    /**
     * The id of the media
     */
    mediaId: number;

    /**
     * The watching/reading status
     */
    status: string;

    /**
     * The score of the entry
     */
    score: number;

    /**
     * The amount of episodes/chapters consumed by the user
     */
    progress: number;

    /**
     * The amount of volumes read by the user
     */
    progressVolumes: number;

    /**
     * The amount of times the user has rewatched/read the media
     */
    repeat: number;

    /**
     * Priority of planning
     */
    priority: number;

    /**
     * If the entry should only be visible to authenticated user
     */
    private: boolean;

    /**
     * Text notes
     */
    notes: string;

    /**
     * If the entry shown be hidden from non-custom lists
     */
    hiddenFromStatusLists: boolean;

    /**
     * Map of booleans for which custom lists the entry are in
     */
    customLists: string[] | boolean[];

    /**
     * Map of advanced scores with name keys
     */
    advancedScores: unknown;

    /**
     * When the entry was started by the user
     */
    startedAt: FuzzyDate;

    /**
     * When the entry was completed by the user
     */
    completedAt: FuzzyDate;

    /**
     * When the entry data was last updated
     */
    updatedAt: number;

    /**
     * When the entry data was created
     */
    createdAt: number;

    /**
     * `media` is an instance of `Media` representing the media.
     */
    media: Media;
}

// @generated-end
