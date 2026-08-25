/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type BasicUser } from "../../Basic";
import { type Media } from "../../Media";
/**
 * `ReviewResponse` — a media review with its score, summary, and author.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/review
 */
export interface ReviewResponse {
    /**
     * The id of the review
     */
    id: number;

    /**
     * The id of the review's media
     */
    mediaId: number;

    /**
     * The id of the review's creator
     */
    userId: number;

    /**
     * For which type of media the review is for
     */
    mediaType: string;

    /**
     * A short summary of the review
     */
    summary: string;

    /**
     * The main review body text
     */
    body: string;

    /**
     * The total user rating of the review
     */
    rating: number;

    /**
     * The amount of user ratings of the review
     */
    ratingAmount: number;

    /**
     * The review score of the media
     */
    score: number;

    /**
     * If the review is not yet publicly published and is only viewable by creator
     */
    private: boolean;

    /**
     * The url for the review page on the AniList website
     */
    siteUrl: string;

    /**
     * The time of the thread creation
     */
    createdAt: number;

    /**
     * The time of the thread last update
     */
    updatedAt: number;

    /**
     * The creator of the review
     */
    user: BasicUser;

    /**
     * The media the review is of
     */
    media: Media;
}

// @generated-end
