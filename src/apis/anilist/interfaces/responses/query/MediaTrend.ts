/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type Media } from "../../Media";
/**
 * `MediaTrendResponse` — a daily popularity statistic for a media.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediatrend
 */
export interface MediaTrendResponse {
    /**
     * The id of the tag
     */
    mediaId: number;

    /**
     * The day the data was recorded (timestamp)
     */
    date: number;

    /**
     * The amount of media activity on the day
     */
    trending: number;

    /**
     * A weighted average score of all the user's scores of the media
     */
    averageScore: number;

    /**
     * The number of users with the media on their list
     */
    popularity: number;

    /**
     * The number of users with watching/reading the media
     */
    inProgress: number;

    /**
     * If the media was being released at this time
     */
    releasing: boolean;

    /**
     * The episode number of the anime released on this day
     */
    episode: number;

    /**
     * The related media
     */
    media: Media;
}

// @generated-end
