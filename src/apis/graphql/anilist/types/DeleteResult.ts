/**
 * `DeleteResult` is the response shape returned by the AniList delete mutations.
 * `deleted` is `true` when the target was deleted by this call and `false` when it was
 * already absent, which makes these mutations safe to retry after a partial failure.
 * @see https://docs.anilist.co/reference/mutation
 */
export type DeleteResult = {
    /**
     * `deleted` is a boolean indicating whether the target was deleted by this call.
     */
    deleted: boolean;
};
