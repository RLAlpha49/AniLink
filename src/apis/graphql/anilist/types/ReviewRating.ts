/**
 * {@link ReviewRating} is the AniList ReviewRating enum: the viewer's vote on a review,
 * sent by the `RateReview` mutation.
 * @see https://docs.anilist.co/reference/enum/reviewrating
 */
export type ReviewRating = "NO_VOTE" | "UP_VOTE" | "DOWN_VOTE";

/**
 * {@link ReviewRatingMappings} is the allowlist of {@link ReviewRating} values accepted
 * by the `rating` variable of the `RateReview` mutation.
 * @see https://docs.anilist.co/reference/enum/reviewrating
 */
export const ReviewRatingMappings: readonly ReviewRating[] = ["NO_VOTE", "UP_VOTE", "DOWN_VOTE"];
