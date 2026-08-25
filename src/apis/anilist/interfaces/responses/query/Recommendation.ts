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
 * `RecommendationResponse` — a media recommendation with its rating and author.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export interface RecommendationResponse {
    /**
     * The id of the recommendation
     */
    id: number;

    /**
     * Users rating of the recommendation
     */
    rating: number;

    /**
     * The rating of the recommendation by currently authenticated user
     */
    userRating: string;

    /**
     * The media the recommendation is from
     */
    media: Media;

    /**
     * The recommended media
     */
    mediaRecommendation: Media;

    /**
     * The user that first created the recommendation
     */
    user: BasicUser;
}

// @generated-end
