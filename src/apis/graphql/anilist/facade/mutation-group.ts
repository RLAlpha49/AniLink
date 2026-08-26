/**
 * The `mutation` member of the `AniListApi` type.
 */
import { type ActivityReply, type Activity } from "../interfaces/Activity";
import { type Likeable } from "../interfaces/Likeable";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type MediaListResponse } from "../interfaces/responses/query/MediaList";
import { type RecommendationResponse } from "../interfaces/responses/query/Recommendation";
import { type ReviewResponse } from "../interfaces/responses/query/Review";
import { type SaveMediaListEntryVariables } from "../mutation/SaveMediaListEntry";
import { type ThreadCommentResponse } from "../interfaces/responses/query/ThreadComment";
import { type ThreadResponse } from "../interfaces/responses/query/Thread";
import { type UpdateMediaListEntriesVariables } from "../mutation/UpdateMediaListEntries";
import { type UpdateUserResponse, type UpdateUserVariables } from "../mutation/UpdateUser";
import { type UserResponse } from "../interfaces/responses/query/User";
import { type DeleteMediaListEntryVariables } from "../mutation/DeleteMediaListEntry";
import { type DeleteMediaListEntryResponse } from "../interfaces/responses/mutation/DeleteMediaListEntry";
import { type DeleteCustomListVariables } from "../mutation/DeleteCustomList";
import { type SaveTextActivityVariables } from "../mutation/SaveTextActivity";
import { type SaveMessageActivityVariables } from "../mutation/SaveMessageActivity";
import { type SaveListActivityVariables } from "../mutation/SaveListActivity";
import { type DeleteActivityVariables } from "../mutation/DeleteActivity";
import { type ToggleActivitySubscriptionVariables } from "../mutation/ToggleActivitySubscription";
import { type ToggleActivityPinVariables } from "../mutation/ToggleActivityPin";
import { type SaveActivityReplyVariables } from "../mutation/SaveActivityReply";
import { type DeleteActivityReplyVariables } from "../mutation/DeleteActivityReply";
import { type ToggleLikeVariables } from "../mutation/ToggleLike";
import { type BasicUser } from "../interfaces/Basic";
import { type ToggleFollowVariables } from "../mutation/ToggleFollow";
import { type ToggleFavouriteVariables } from "../mutation/ToggleFavourite";
import { type Favourites } from "../interfaces/responses/mutation/Favourites";
import { type UpdateFavouriteOrderVariables } from "../mutation/UpdateFavouriteOrder";
import { type SaveReviewVariables } from "../mutation/SaveReview";
import { type RateReviewVariables } from "../mutation/RateReview";
import { type DeleteReviewVariables } from "../mutation/DeleteReview";
import { type SaveRecommendationVariables } from "../mutation/SaveRecommendation";
import { type SaveThreadVariables } from "../mutation/SaveThread";
import { type DeleteThreadVariables } from "../mutation/DeleteThread";
import { type ToggleThreadSubscriptionVariables } from "../mutation/ToggleThreadSubscription";
import { type SaveThreadCommentVariables } from "../mutation/SaveThreadComment";
import { type DeleteThreadCommentVariables } from "../mutation/DeleteThreadComment";
import { type UpdateAniChartSettingsVariables } from "../mutation/UpdateAniChartSettings";
import { type UpdateAniChartHighlightsVariables } from "../mutation/UpdateAniChartHighlights";
import { type DeleteResult } from "../types/DeleteResult";

export type AniListMutations = {
    /**
     * Mutation methods for updating data on the Anilist API.
     * @public
     * @type {Object}
     * @property {Function} updateUser - Updates a user on the Anilist API.
     * @property {Function} saveMediaListEntry - Saves a media list entry on the Anilist API.
     * @property {Function} updateMediaListEntries - Updates media list entries on the Anilist API.
     * @property {Function} deleteMediaListEntry - Deletes a media list entry on the Anilist API.
     * @property {Function} deleteCustomList - Deletes a custom list on the Anilist API.
     * @property {Function} saveTextActivity - Saves a text activity on the Anilist API.
     * @property {Function} saveMessageActivity - Saves a message activity on the Anilist API.
     * @property {Function} saveListActivity - Saves a list activity on the Anilist API.
     * @property {Function} deleteActivity - Deletes an activity on the Anilist API.
     * @property {Function} toggleActivityPin - Toggles an activity's pin status on the Anilist API.
     * @property {Function} toggleActivitySubscription - Toggles an activity's subscription status on the Anilist API.
     * @property {Function} saveActivityReply - Saves an activity reply on the Anilist API.
     * @property {Function} deleteActivityReply - Deletes an activity reply on the Anilist API.
     * @property {Function} toggleLike - Toggles a like on the Anilist API.
     * @property {Function} toggleLikeV2 - Toggles a like on the Anilist API.
     * @property {Function} toggleFollow - Toggles a follow on the Anilist API.
     * @property {Function} toggleFavourite - Toggles a favorite on the Anilist API.
     * @property {Function} updateFavouriteOrder - Updates a favorite order on the Anilist API.
     * @property {Function} saveReview - Saves a review on the Anilist API.
     * @property {Function} rateReview - Rates a review on the Anilist API.
     * @property {Function} deleteReview - Deletes a review on the Anilist API.
     * @property {Function} saveRecommendation - Saves a recommendation on the Anilist API.
     * @property {Function} saveThread - Saves a thread on the Anilist API.
     * @property {Function} deleteThread - Deletes a thread on the Anilist API.
     * @property {Function} toggleThreadSubscription - Toggles a thread's subscription status on the Anilist API.
     * @property {Function} saveThreadComment - Saves a thread comment on the Anilist API.
     * @property {Function} deleteThreadComment - Deletes a thread comment on the Anilist API.
     * @property {Function} updateAniChartSettings - Updates aniChart settings on the Anilist API.
     * @property {Function} updateAniChartHighlights - Updates aniChart highlights on the Anilist API.
     *
     * Must be authenticated for all mutations.
     */
    mutation: {
        /**
         * Updates a user on the Anilist API.
         * @param {UpdateUserVariables} variables - The variables for the mutation.
         * @returns {Promise<UpdateUserResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateUser({
         *   about: 'New about text',
         *   titleLanguage: 'ENGLISH',
         *   displayAdultContent: true,
         *   airingNotifications: true,
         *   scoreFormat: 'POINT_10',
         *   rowOrder: 'title',
         *   profileColor: 'blue',
         *   donatorBadge: 'Supporter',
         *   notificationOptions: [{type: 'AIRING', enabled: true}],
         *   timezone: '-06:00',
         *   activityMergeTime: 30,
         *   animeListOptions: {sectionOrder: ['title'], customLists: ['test'], advancedScoring: [], advancedScoringEnabled: false},
         *   mangaListOptions: {sectionOrder: ['title'], customLists: ['test'], advancedScoring: [], advancedScoringEnabled: false},
         *   staffNameLanguage: 'ROMAJI',
         *   restrictMessagesToFollowing: false,
         *   disabledListActivity: [{type: 'CURRENT', disabled: false}]
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/user
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        updateUser: (
            variables: UpdateUserVariables,
            options?: RequestOptions
        ) => Promise<UpdateUserResponse>;

        /**
         * Saves a media list entry on the Anilist API.
         * @param {SaveMediaListEntryVariables} variables - The variables for the mutation.
         * @returns {Promise<MediaListResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveMediaListEntry({mediaId: 1, status: 'COMPLETED'});
         * ```
         * @see https://docs.anilist.co/reference/object/medialist
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveMediaListEntry: (
            variables: SaveMediaListEntryVariables,
            options?: RequestOptions
        ) => Promise<MediaListResponse>;

        /**
         * Updates media list entries on the Anilist API.
         * @param {UpdateMediaListEntriesVariables} variables - The variables for the mutation.
         * @returns {Promise<MediaListResponse[]>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateMediaListEntries({
         *   status: 'CURRENT',
         *   score: 8.5,
         *   progress: 3,
         *   ids: [143271, 156822, 170890],
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/medialist
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        updateMediaListEntries: (
            variables: UpdateMediaListEntriesVariables,
            options?: RequestOptions
        ) => Promise<MediaListResponse[]>;

        /**
         * Deletes a media list entry on the Anilist API.
         * @param {DeleteMediaListEntryVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteMediaListEntryResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * You cannot delete a media list entry without first fetching the entry's id. The entry's id is not the same as the mediaId. It is specific to each user and media.
         * ```typescript
         * await aniLink.anilist.mutation.deleteMediaListEntry({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteMediaListEntry: (
            variables: DeleteMediaListEntryVariables,
            options?: RequestOptions
        ) => Promise<DeleteMediaListEntryResponse>;

        /**
         * Deletes a custom list on the Anilist API. There is no mutation specifically for creating a custom list. You can create a custom list through the `updateUser` mutation under the `animeListOptions` or `mangaListOptions` variables.
         * @param {DeleteCustomListVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the  custom list was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteCustomLists({customList: 'test'});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteCustomList: (
            variables: DeleteCustomListVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Saves a text activity on the Anilist API. If no `id` is provided, a new activity will be created. If an `id` is provided, the activity with that `id` will be updated.
         * @param {SaveTextActivityVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveTextActivity({text: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveTextActivity: (
            variables: SaveTextActivityVariables,
            options?: RequestOptions
        ) => Promise<Activity>;

        /**
         * Saves a message activity on the Anilist API. If no `id` is provided, a new activity will be created. If an `id` is provided, the activity with that `id` will be updated.
         * @param {SaveMessageActivityVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveMessageActivity({text: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveMessageActivity: (
            variables: SaveMessageActivityVariables,
            options?: RequestOptions
        ) => Promise<Activity>;

        /**
         * Saves a list activity on the Anilist API.
         * Mod Only
         * @param {SaveListActivityVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveListActivity({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveListActivity: (
            variables: SaveListActivityVariables,
            options?: RequestOptions
        ) => Promise<Activity>;

        /**
         * Deletes an activity on the Anilist API.
         * Mod Only
         * @param {DeleteActivityVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the          activity was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteActivity({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteActivity: (
            variables: DeleteActivityVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Toggles the pin status of an activity on the Anilist API.
         *
         * @param {ToggleActivityPinVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleActivityPin({id: 1, pinned: true});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleActivityPin: (
            variables: ToggleActivityPinVariables,
            options?: RequestOptions
        ) => Promise<Activity>;

        /**
         * Toggles the subscription status of an activity on the Anilist API.
         *
         * @param {ToggleActivitySubscriptionVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleActivitySubscription({activityId: 1, subscribe: true});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleActivitySubscription: (
            variables: ToggleActivitySubscriptionVariables,
            options?: RequestOptions
        ) => Promise<Activity>;

        /**
         * Saves an activity reply on the Anilist API. If no `id` is provided, a new activity reply will be created. If an `id` is provided, the activity reply with that `id` will be updated.
         * @param {SaveActivityReplyVariables} variables - The variables for the mutation.
         * @returns {Promise<ActivityReply>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveActivityReply({activityId: 1, text: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/object/activityreply
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveActivityReply: (
            variables: SaveActivityReplyVariables,
            options?: RequestOptions
        ) => Promise<ActivityReply>;

        /**
         * Deletes an activity reply on the Anilist API.
         * @param {DeleteActivityReplyVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the reply was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteActivityReply({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteActivityReply: (
            variables: DeleteActivityReplyVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Toggles a like on the Anilist API.
         * @param {ToggleLikeVariables} variables - The variables for the mutation.
         * @returns {Promise<BasicUser>} A promise that resolves to the user who performed the like toggle.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleLike({id: 1, type: 'ACTIVITY'});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleLike: (
            variables: ToggleLikeVariables,
            options?: RequestOptions
        ) => Promise<BasicUser>;

        /**
         * Toggles a like on the Anilist API.
         * Returns a different response than the `toggleLike` mutation.
         * @param {ToggleLikeVariables} variables - The variables for the mutation.
         * @returns {Promise<Likeable>} A promise that resolves to the liked entity: an activity,
         * activity reply, thread, or thread comment depending on the likeable type.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleLikeV2({id: 1, type: 'ACTIVITY'});
         * ```
         * @see https://docs.anilist.co/reference/union/likeableunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleLikeV2: (
            variables: ToggleLikeVariables,
            options?: RequestOptions
        ) => Promise<Likeable>;

        /**
         * Toggles a follow on the Anilist API.
         * @param {ToggleFollowVariables} variables - The variables for the mutation.
         * @returns {Promise<UserResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleFollow({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleFollow: (
            variables: ToggleFollowVariables,
            options?: RequestOptions
        ) => Promise<UserResponse>;

        /**
         * Toggles a favorite on the Anilist API.
         * @param {ToggleFavouriteVariables} variables - The variables for the mutation.
         * @returns {Promise<Favourites>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleFavorite({studioId: 561});
         * ```
         * @see https://docs.anilist.co/reference/object/favourites
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleFavourite: (
            variables: ToggleFavouriteVariables,
            options?: RequestOptions
        ) => Promise<Favourites>;

        /**
         * Updates the order of favourites on the Anilist API.
         * @param {UpdateFavouriteOrderVariables} variables - The variables for the mutation.
         * @returns {Promise<Favourites>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateFavouriteOrder({ids: [1, 2, 3]});
         * ```
         * @see https://docs.anilist.co/reference/object/favourites
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        updateFavouriteOrder: (
            variables: UpdateFavouriteOrderVariables,
            options?: RequestOptions
        ) => Promise<Favourites>;

        /**
         * Saves a review on the Anilist API. If no `id` is provided, a new review will be created. If an `id` is provided, the review with that `id` will be updated.
         * @param {SaveReviewVariables} variables - The variables for the mutation.
         * @returns {Promise<ReviewResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveReview({mediaId: 1, body: 'testing', summary: 'testing', score: 8, private: true});
         * ```
         * @see https://docs.anilist.co/reference/object/review
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveReview: (
            variables: SaveReviewVariables,
            options?: RequestOptions
        ) => Promise<ReviewResponse>;

        /**
         * Rates a review on the Anilist API.
         * @param {RateReviewVariables} variables - The variables for the mutation.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the rated review.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.rateReview({reviewId: 8008, rating: 'UP_VOTE'});
         * ```
         * @see https://docs.anilist.co/reference/object/review
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        rateReview: (
            variables: RateReviewVariables,
            options?: RequestOptions
        ) => Promise<ReviewResponse>;

        /**
         * Deletes a review on the Anilist API.
         * @param {DeleteReviewVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the review was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteReview({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteReview: (
            variables: DeleteReviewVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Saves a recommendation on the Anilist API.
         * @param {SaveRecommendationVariables} variables - The variables for the mutation.
         * @returns {Promise<RecommendationResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveRecommendation({mediaId: 1, mediaRecommendationId: 2, rating: 8});
         * ```
         * @see https://docs.anilist.co/reference/object/recommendation
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveRecommendation: (
            variables: SaveRecommendationVariables,
            options?: RequestOptions
        ) => Promise<RecommendationResponse>;

        /**
         * Saves a thread on the Anilist API. If no `id` is provided, a new thread will be created. If an `id` is provided, the thread with that `id` will be updated.
         * @param {SaveThreadVariables} variables - The variables for the mutation.
         * @returns {Promise<ThreadResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveThread({title: 'Hello, world!', body: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/object/thread
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveThread: (
            variables: SaveThreadVariables,
            options?: RequestOptions
        ) => Promise<ThreadResponse>;

        /**
         * Deletes a thread on the Anilist API.
         * @param {DeleteThreadVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the thread was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteThread({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteThread: (
            variables: DeleteThreadVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Toggles a thread subscription on the Anilist API.
         * @param {ToggleThreadSubscriptionVariables} variables - The variables for the mutation.
         * @returns {Promise<ThreadResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleThreadSubscription({threadId: 1, subscribe: true});
         * ```
         * @see https://docs.anilist.co/reference/object/thread
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleThreadSubscription: (
            variables: ToggleThreadSubscriptionVariables,
            options?: RequestOptions
        ) => Promise<ThreadResponse>;

        /**
         * Saves a thread comment on the Anilist API. If no `id` is provided, a new thread comment will be created. If an `id` is provided, the thread comment with that `id` will be updated.
         * @param {SaveThreadCommentVariables} variables - The variables for the mutation.
         * @returns {Promise<ThreadCommentResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveThreadComment({threadId: 1, comment: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/object/threadcomment
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveThreadComment: (
            variables: SaveThreadCommentVariables,
            options?: RequestOptions
        ) => Promise<ThreadCommentResponse>;

        /**
         * Deletes a thread comment on the Anilist API.
         * @param {DeleteThreadCommentVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the comment was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteThreadComment({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteThreadComment: (
            variables: DeleteThreadCommentVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Updates the AniChart settings for a user on the Anilist API.
         * @param {UpdateAniChartSettingsVariables} variables - The variables for the mutation.
         * @returns {Promise<string>} A promise that resolves to the updated AniChart settings string.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateAniChartSettings({titleLanguage: 'romaji', theme: 'dark'});
         * ```
         * @see https://docs.anilist.co/reference/object/anichartuser
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        updateAniChartSettings: (
            variables: UpdateAniChartSettingsVariables,
            options?: RequestOptions
        ) => Promise<string>;

        /**
         * Updates the AniChart highlights for a user on the Anilist API.
         * @param {UpdateAniChartHighlightsVariables} variables - The variables for the mutation.
         * @returns {Promise<string>} A promise that resolves to the updated AniChart highlights string.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateAniChartHighlights({highlights: [{mediaId: 1, highlight: 'test'}]});
         * ```
         * @see https://docs.anilist.co/reference/object/anichartuser
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        updateAniChartHighlights: (
            variables: UpdateAniChartHighlightsVariables,
            options?: RequestOptions
        ) => Promise<string>;
    };
};
