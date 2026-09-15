/**
 * {@link RecommendationRating} is the AniList RecommendationRating enum: the viewer's vote
 * on a recommendation, sent by the `SaveRecommendation` mutation.
 * @see https://docs.anilist.co/reference/enum/recommendationrating
 */
export type RecommendationRating = "NO_RATING" | "RATE_UP" | "RATE_DOWN";

/**
 * {@link RecommendationRatingMappings} is the allowlist of {@link RecommendationRating} values
 * accepted by the `rating` variable of the `SaveRecommendation` mutation.
 * @see https://docs.anilist.co/reference/enum/recommendationrating
 */
export const RecommendationRatingMappings: readonly RecommendationRating[] = [
    "NO_RATING",
    "RATE_UP",
    "RATE_DOWN",
];
