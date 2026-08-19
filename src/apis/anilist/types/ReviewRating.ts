/**
 * `ReviewRating` is a type representing the rating of a review.
 * It can be one of the following: 'NO_VOTE', 'UP_VOTE', 'DOWN_VOTE'.
 * @see https://docs.anilist.co/reference/enum/reviewrating
 */
export type ReviewRating = "NO_VOTE" | "UP_VOTE" | "DOWN_VOTE";

/**
 * `ReviewRatingMappings` is a mapping of `ReviewRating` enum values to their corresponding string values.
 * It can be one of the following: 'NO_VOTE', 'UP_VOTE', 'DOWN_VOTE'.
 * @see https://docs.anilist.co/reference/enum/reviewrating
 */
export const ReviewRatingMappings = ["NO_VOTE", "UP_VOTE", "DOWN_VOTE"];
