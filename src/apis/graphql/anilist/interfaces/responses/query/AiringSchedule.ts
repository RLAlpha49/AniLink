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
 * `AiringScheduleResponse` — an airing schedule entry together with its media.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/airingschedule
 */
export interface AiringScheduleResponse {
    /**
     * The id of the airing schedule item
     */
    id: number;

    /**
     * The time the episode airs at
     */
    airingAt: number;

    /**
     * Seconds until episode starts airing
     */
    timeUntilAiring: number;

    /**
     * The airing episode number
     */
    episode: number;

    /**
     * The associate media id of the airing episode
     */
    mediaId: number;

    /**
     * The associate media of the airing episode
     */
    media: Media;
}

// @generated-end
