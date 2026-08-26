/**
 * `RecommendationRating` is a type representing the rating of a recommendation.
 * It can be one of the following: 'NO_RATING', 'RATE_UP', 'RATE_DOWN'.
 * @see https://docs.anilist.co/reference/enum/recommendationrating
 */
export type RecommendationRating = "NO_RATING" | "RATE_UP" | "RATE_DOWN";

/**
 * `RecommendationRatingMappings` is a mapping of `RecommendationRating` enum values to their corresponding string values.
 * It can be one of the following: 'NO_RATING', 'RATE_UP', 'RATE_DOWN'.
 * @see https://docs.anilist.co/reference/enum/recommendationrating
 */
export const RecommendationRatingMappings: readonly RecommendationRating[] = [
    "NO_RATING",
    "RATE_UP",
    "RATE_DOWN",
];
