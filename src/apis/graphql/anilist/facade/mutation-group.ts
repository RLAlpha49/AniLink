/**
 * The `mutation` member of the `AniListApi` type.
 *
 * GENERATED FILE — do not edit by hand; regenerate with `npm run facade:generate`.
 * Signatures derive from the operation registry and operation classes; curated
 * JSDoc prose lives in scripts/generate-facade-groups.config.ts.
 */
import { type RequestOptions } from "../../../../base/RequestHandler";
import {
    type Activity,
    type ActivityReply,
    type ListActivity,
    type MessageActivity,
    type TextActivity,
} from "../interfaces/Activity";
import { type BasicUser } from "../interfaces/Basic";
import { type Likeable } from "../interfaces/Likeable";
import { type DeleteMediaListEntryResponse } from "../interfaces/responses/mutation/DeleteMediaListEntry";
import { type Favourites } from "../interfaces/responses/mutation/Favourites";
import { type MediaListResponse } from "../interfaces/responses/query/MediaList";
import { type RecommendationResponse } from "../interfaces/responses/query/Recommendation";
import { type ReviewResponse } from "../interfaces/responses/query/Review";
import { type ThreadResponse } from "../interfaces/responses/query/Thread";
import { type ThreadCommentResponse } from "../interfaces/responses/query/ThreadComment";
import { type UserResponse } from "../interfaces/responses/query/User";
import { type DeleteActivityVariables } from "../mutation/DeleteActivity";
import { type DeleteActivityReplyVariables } from "../mutation/DeleteActivityReply";
import { type DeleteCustomListVariables } from "../mutation/DeleteCustomList";
import { type DeleteMediaListEntryVariables } from "../mutation/DeleteMediaListEntry";
import { type DeleteReviewVariables } from "../mutation/DeleteReview";
import { type DeleteThreadVariables } from "../mutation/DeleteThread";
import { type DeleteThreadCommentVariables } from "../mutation/DeleteThreadComment";
import { type RateReviewVariables } from "../mutation/RateReview";
import { type SaveActivityReplyVariables } from "../mutation/SaveActivityReply";
import { type SaveListActivityVariables } from "../mutation/SaveListActivity";
import {
    type SaveMediaListEntryFields,
    type SaveMediaListEntryVariables,
} from "../mutation/SaveMediaListEntry";
import { type SaveMessageActivityVariables } from "../mutation/SaveMessageActivity";
import { type SaveRecommendationVariables } from "../mutation/SaveRecommendation";
import { type SaveReviewVariables } from "../mutation/SaveReview";
import { type SaveTextActivityVariables } from "../mutation/SaveTextActivity";
import { type SaveThreadVariables } from "../mutation/SaveThread";
import { type SaveThreadCommentVariables } from "../mutation/SaveThreadComment";
import { type ToggleActivityPinVariables } from "../mutation/ToggleActivityPin";
import { type ToggleActivitySubscriptionVariables } from "../mutation/ToggleActivitySubscription";
import { type ToggleFavouriteVariables } from "../mutation/ToggleFavourite";
import { type ToggleFollowVariables } from "../mutation/ToggleFollow";
import { type ToggleLikeVariables } from "../mutation/ToggleLike";
import { type ToggleThreadSubscriptionVariables } from "../mutation/ToggleThreadSubscription";
import { type UpdateAniChartHighlightsVariables } from "../mutation/UpdateAniChartHighlights";
import { type UpdateAniChartSettingsVariables } from "../mutation/UpdateAniChartSettings";
import { type UpdateFavouriteOrderVariables } from "../mutation/UpdateFavouriteOrder";
import { type UpdateMediaListEntriesVariables } from "../mutation/UpdateMediaListEntries";
import { type UpdateUserResponse, type UpdateUserVariables } from "../mutation/UpdateUser";
import { type RegistryMutationKeys } from "../registry";
import { type DeepPick, type FieldPath } from "../schemas/selection/fieldsSelection";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * Compile-time exhaustiveness check between this facade group and the
 * operation registry. The bidirectional type assertion ensures that
 * `RegistryMutationKeys` and `keyof AniListMutations["mutation"]` are the
 * same set: a key added or removed in either place produces a type error. The
 * registry is the source of truth; this asserts the typed surface keeps pace.
 */
const _assertMutationParity: RegistryMutationKeys =
    null as unknown as keyof AniListMutations["mutation"];
const _assertMutationParityReverse: keyof AniListMutations["mutation"] =
    null as unknown as RegistryMutationKeys;

/**
 * Typed AniList mutation operations exposed by `AniListApi`.
 *
 * @see https://docs.anilist.co/reference/mutation
 */
export type AniListMutations = {
    /**
     * Mutation methods for updating data on the AniList API.
     * @public
     * @type {Object}
     * @property {Function} updateUser - Updates the authenticated user on the AniList API.
     * @property {Function} saveMediaListEntry - Saves a media list entry on the AniList API.
     * @property {Function} updateMediaListEntries - Updates media list entries on the AniList API.
     * @property {Function} deleteMediaListEntry - Deletes a media list entry.
     * @property {Function} deleteCustomList - Deletes a custom list.
     * @property {Function} saveTextActivity - Saves a text activity on the AniList API.
     * @property {Function} saveMessageActivity - Saves a message activity on the AniList API.
     * @property {Function} saveListActivity - Saves a list activity on the AniList API.
     * @property {Function} deleteActivity - Deletes an activity on the AniList API.
     * @property {Function} toggleActivityPin - Toggles an activity's pin status on the AniList API.
     * @property {Function} toggleActivitySubscription - Toggles an activity's subscription status.
     * @property {Function} saveActivityReply - Saves an activity reply on the AniList API.
     * @property {Function} deleteActivityReply - Deletes an activity reply.
     * @property {Function} toggleLike - Toggles a like.
     * @property {Function} toggleLikeV2 - Toggles a like on the AniList API.
     * @property {Function} toggleFollow - Toggles a follow on the AniList API.
     * @property {Function} toggleFavourite - Toggles a favourite on the AniList API.
     * @property {Function} updateFavouriteOrder - Updates a favourite order.
     * @property {Function} saveReview - Saves a review on the AniList API.
     * @property {Function} rateReview - Rates a review.
     * @property {Function} deleteReview - Deletes a review.
     * @property {Function} saveRecommendation - Saves a recommendation on the AniList API.
     * @property {Function} saveThread - Saves a thread on the AniList API.
     * @property {Function} deleteThread - Deletes a thread.
     * @property {Function} toggleThreadSubscription - Toggles a thread's subscription status.
     * @property {Function} saveThreadComment - Saves a thread comment on the AniList API.
     * @property {Function} deleteThreadComment - Deletes a thread comment.
     * @property {Function} updateAniChartSettings - Updates AniChart settings on the AniList API.
     * @property {Function} updateAniChartHighlights - Updates AniChart highlights on the AniList API.
     *
     * Must be authenticated for all mutations.
     */
    mutation: {
        /**
         * `UpdateUserMutation` updates the authenticated user's profile and list settings.
         * @param {UpdateUserVariables} variables - The {@link UpdateUserVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<UpdateUserResponse>} A promise that resolves to the {@link UpdateUserResponse} data.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
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
         */
        updateUser: ((
            variables: UpdateUserVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<UpdateUserResponse>) &
            ((
                variables: UpdateUserVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<UpdateUserResponse>) &
            (<K extends FieldPath<UpdateUserResponse>>(
                variables: UpdateUserVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<UpdateUserResponse, K>>);

        /**
         * `SaveMediaListEntryMutation` creates or updates the authenticated user's list entry for one media; `mediaId` is required, `id` only when updating.
         * @param {SaveMediaListEntryVariables} variables - The {@link SaveMediaListEntryVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<MediaListResponse>} A promise that resolves to the {@link MediaListResponse} data.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveMediaListEntry({mediaId: 1, status: 'COMPLETED'});
         * ```
         * @see https://docs.anilist.co/reference/object/medialist
         */
        saveMediaListEntry: ((
            variables: SaveMediaListEntryVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<MediaListResponse>) &
            ((
                variables: SaveMediaListEntryVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<MediaListResponse>) &
            (<K extends FieldPath<SaveMediaListEntryFields>>(
                variables: SaveMediaListEntryVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<MediaListResponse, K>>);

        /**
         * `UpdateMediaListEntriesMutation` applies one set of changes to every list entry in `ids`.
         * @param {UpdateMediaListEntriesVariables} variables - The {@link UpdateMediaListEntriesVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<MediaListResponse[]>} A promise that resolves to an array of {@link MediaListResponse} entries, one per id.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
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
         */
        updateMediaListEntries: ((
            variables: UpdateMediaListEntriesVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<MediaListResponse[]>) &
            ((
                variables: UpdateMediaListEntriesVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<MediaListResponse[]>) &
            (<K extends FieldPath<MediaListResponse>>(
                variables: UpdateMediaListEntriesVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<MediaListResponse, K>[]>);

        /**
         * `DeleteMediaListEntryMutation` deletes one of the authenticated user's list entries by entry `id`.
         * @param {DeleteMediaListEntryVariables} variables - The {@link DeleteMediaListEntryVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<DeleteMediaListEntryResponse>} A promise that resolves to a {@link DeleteMediaListEntryResponse} — `{ deleted }`, where `deleted` is `true` when the entry was deleted by this call and `false` when it was already absent.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * You cannot delete a media list entry without first fetching the entry's id. The entry's id is not the same as the mediaId. It is specific to each user and media.
         * ```typescript
         * await aniLink.anilist.mutation.deleteMediaListEntry({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         */
        deleteMediaListEntry: ((
            variables: DeleteMediaListEntryVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<DeleteMediaListEntryResponse>) &
            ((
                variables: DeleteMediaListEntryVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<DeleteMediaListEntryResponse>) &
            (<K extends FieldPath<DeleteMediaListEntryResponse>>(
                variables: DeleteMediaListEntryVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<DeleteMediaListEntryResponse, K>>);

        /**
         * `DeleteCustomListMutation` deletes a custom list and removes its entries. There is no mutation for creating a custom list; create one through `UpdateUserMutation` under the `animeListOptions` or `mangaListOptions` variables.
         * @param {DeleteCustomListVariables} variables - The {@link DeleteCustomListVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the custom list was deleted by this call and `false` when it was already absent.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteCustomList({customList: 'test', type: 'ANIME'});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         */
        deleteCustomList: ((
            variables: DeleteCustomListVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<DeleteResult>) &
            ((
                variables: DeleteCustomListVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<DeleteResult>) &
            (<K extends FieldPath<DeleteResult>>(
                variables: DeleteCustomListVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<DeleteResult, K>>);

        /**
         * `SaveTextActivityMutation` creates or updates the authenticated user's text activity; `id` is required only when updating.
         * @param {SaveTextActivityVariables} variables - The {@link SaveTextActivityVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<Activity>} A promise that resolves to the saved {@link Activity}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveTextActivity({id: 1, text: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         */
        saveTextActivity: ((
            variables: SaveTextActivityVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<Activity>) &
            ((
                variables: SaveTextActivityVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<Activity>) &
            (<K extends FieldPath<TextActivity>>(
                variables: SaveTextActivityVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<TextActivity, K>>);

        /**
         * `SaveMessageActivityMutation` creates or updates a message activity for the authenticated user; `id` is required only when updating.
         * @param {SaveMessageActivityVariables} variables - The {@link SaveMessageActivityVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<Activity>} A promise that resolves to the saved {@link Activity}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveMessageActivity({id: 1, message: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         */
        saveMessageActivity: ((
            variables: SaveMessageActivityVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<Activity>) &
            ((
                variables: SaveMessageActivityVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<Activity>) &
            (<K extends FieldPath<MessageActivity>>(
                variables: SaveMessageActivityVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<MessageActivity, K>>);

        /**
         * `SaveListActivityMutation` saves a list activity on the AniList API.
         * Mod Only
         * @param {SaveListActivityVariables} variables - The {@link SaveListActivityVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<Activity>} A promise that resolves to the saved {@link Activity}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveListActivity({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         */
        saveListActivity: ((
            variables: SaveListActivityVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<Activity>) &
            ((
                variables: SaveListActivityVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<Activity>) &
            (<K extends FieldPath<ListActivity>>(
                variables: SaveListActivityVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<ListActivity, K>>);

        /**
         * `DeleteActivityMutation` deletes one of the authenticated user's own activities.
         * @param {DeleteActivityVariables} variables - The {@link DeleteActivityVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the activity was deleted by this call and `false` when it was already absent.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteActivity({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         */
        deleteActivity: ((
            variables: DeleteActivityVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<DeleteResult>) &
            ((
                variables: DeleteActivityVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<DeleteResult>) &
            (<K extends FieldPath<DeleteResult>>(
                variables: DeleteActivityVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<DeleteResult, K>>);

        /**
         * `ToggleActivityPinMutation` pins or unpins an activity on the authenticated user's activity feed.
         *
         * @param {ToggleActivityPinVariables} variables - The {@link ToggleActivityPinVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<Activity>} A promise that resolves to the updated {@link Activity}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleActivityPin({id: 1, pinned: true});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         */
        toggleActivityPin: ((
            variables: ToggleActivityPinVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<Activity>) &
            ((
                variables: ToggleActivityPinVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<Activity>) &
            (<K extends FieldPath<Activity>>(
                variables: ToggleActivityPinVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<Activity, K>>);

        /**
         * `ToggleActivitySubscriptionMutation` subscribes or unsubscribes the authenticated user from an activity.
         *
         * @param {ToggleActivitySubscriptionVariables} variables - The {@link ToggleActivitySubscriptionVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<Activity>} A promise that resolves to the updated {@link Activity}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleActivitySubscription({activityId: 1, subscribe: true});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         */
        toggleActivitySubscription: ((
            variables: ToggleActivitySubscriptionVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<Activity>) &
            ((
                variables: ToggleActivitySubscriptionVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<Activity>) &
            (<K extends FieldPath<Activity>>(
                variables: ToggleActivitySubscriptionVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<Activity, K>>);

        /**
         * `SaveActivityReplyMutation` creates or updates a reply on an activity; `id` is required only when updating.
         * @param {SaveActivityReplyVariables} variables - The {@link SaveActivityReplyVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ActivityReply>} A promise that resolves to the saved {@link ActivityReply}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveActivityReply({id: 1, activityId: 2, text: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/object/activityreply
         */
        saveActivityReply: ((
            variables: SaveActivityReplyVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<ActivityReply>) &
            ((
                variables: SaveActivityReplyVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<ActivityReply>) &
            (<K extends FieldPath<ActivityReply>>(
                variables: SaveActivityReplyVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<ActivityReply, K>>);

        /**
         * `DeleteActivityReplyMutation` deletes one of the authenticated user's activity replies by `id`.
         * @param {DeleteActivityReplyVariables} variables - The {@link DeleteActivityReplyVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the reply was deleted by this call and `false` when it was already absent.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteActivityReply({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         */
        deleteActivityReply: ((
            variables: DeleteActivityReplyVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<DeleteResult>) &
            ((
                variables: DeleteActivityReplyVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<DeleteResult>) &
            (<K extends FieldPath<DeleteResult>>(
                variables: DeleteActivityReplyVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<DeleteResult, K>>);

        /**
         * `ToggleLikeMutation` toggles the authenticated user's like on a likeable entity.
         * @param {ToggleLikeVariables} variables - The {@link ToggleLikeVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<BasicUser>} A promise that resolves to the {@link BasicUser} who performed the like toggle.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         * @deprecated Use `toggleLikeV2` instead, which returns the richer {@link Likeable} union (activity, activity reply, thread, or thread comment) instead of a bare user.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleLike({id: 1, type: 'ACTIVITY'});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         */
        toggleLike: ((
            variables: ToggleLikeVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<BasicUser>) &
            ((
                variables: ToggleLikeVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<BasicUser>) &
            (<K extends FieldPath<BasicUser>>(
                variables: ToggleLikeVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<BasicUser, K>>);

        /**
         * `ToggleLikeV2Mutation` toggles the authenticated user's like on a likeable entity, returning the liked entity itself.
         * @param {ToggleLikeVariables} variables - The {@link ToggleLikeVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<Likeable>} A promise that resolves to the liked {@link Likeable} entity: an activity,
         * activity reply, thread, or thread comment depending on the likeable type.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleLikeV2({id: 1, type: 'ACTIVITY'});
         * ```
         * @see https://docs.anilist.co/reference/union/likeableunion
         */
        toggleLikeV2: ((
            variables: ToggleLikeVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<Likeable>) &
            ((
                variables: ToggleLikeVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<Likeable>) &
            (<K extends FieldPath<Likeable>>(
                variables: ToggleLikeVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<Likeable, K>>);

        /**
         * `ToggleFollowMutation` toggles the authenticated user's follow of the user named by `userId`.
         * @param {ToggleFollowVariables} variables - The {@link ToggleFollowVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<UserResponse>} A promise that resolves to the updated {@link UserResponse}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleFollow({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         */
        toggleFollow: ((
            variables: ToggleFollowVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<UserResponse>) &
            ((
                variables: ToggleFollowVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<UserResponse>) &
            (<K extends FieldPath<UserResponse>>(
                variables: ToggleFollowVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<UserResponse, K>>);

        /**
         * `ToggleFavouriteMutation` toggles the authenticated user's favourite on an anime, manga, character, staff member, or studio; pass the id of the entity to toggle.
         * @param {ToggleFavouriteVariables} variables - The {@link ToggleFavouriteVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<Favourites>} A promise that resolves to the updated {@link Favourites}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleFavourite({studioId: 561});
         * ```
         * @see https://docs.anilist.co/reference/object/favourites
         */
        toggleFavourite: ((
            variables: ToggleFavouriteVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<Favourites>) &
            ((
                variables: ToggleFavouriteVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<Favourites>) &
            (<K extends FieldPath<Favourites>>(
                variables: ToggleFavouriteVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<Favourites, K>>);

        /**
         * `UpdateFavouriteOrderMutation` rewrites the display order of the authenticated user's favourites in every category.
         * @param {UpdateFavouriteOrderVariables} variables - The {@link UpdateFavouriteOrderVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<Favourites>} A promise that resolves to the updated {@link Favourites}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateFavouriteOrder({
         *   animeIds: [1],
         *   mangaIds: [],
         *   characterIds: [],
         *   staffIds: [],
         *   studioIds: [],
         *   animeOrder: [1],
         *   mangaOrder: [],
         *   characterOrder: [],
         *   staffOrder: [],
         *   studioOrder: [],
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/favourites
         */
        updateFavouriteOrder: ((
            variables: UpdateFavouriteOrderVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<Favourites>) &
            ((
                variables: UpdateFavouriteOrderVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<Favourites>) &
            (<K extends FieldPath<Favourites>>(
                variables: UpdateFavouriteOrderVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<Favourites, K>>);

        /**
         * `SaveReviewMutation` creates or updates a review.
         * @param {SaveReviewVariables} variables - The {@link SaveReviewVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the saved {@link ReviewResponse}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveReview({id: 1, mediaId: 1, body: 'testing', summary: 'testing', score: 8, private: true});
         * ```
         * @see https://docs.anilist.co/reference/object/review
         */
        saveReview: ((
            variables: SaveReviewVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<ReviewResponse>) &
            ((
                variables: SaveReviewVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<ReviewResponse>) &
            (<K extends FieldPath<ReviewResponse>>(
                variables: SaveReviewVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<ReviewResponse, K>>);

        /**
         * `RateReviewMutation` sets the authenticated user's rating (`UP_VOTE`/`DOWN_VOTE`) on a review.
         * @param {RateReviewVariables} variables - The {@link RateReviewVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the rated {@link ReviewResponse}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.rateReview({reviewId: 8008, rating: 'UP_VOTE'});
         * ```
         * @see https://docs.anilist.co/reference/object/review
         */
        rateReview: ((
            variables: RateReviewVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<ReviewResponse>) &
            ((
                variables: RateReviewVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<ReviewResponse>) &
            (<K extends FieldPath<ReviewResponse>>(
                variables: RateReviewVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<ReviewResponse, K>>);

        /**
         * `DeleteReviewMutation` deletes one of the authenticated user's reviews by `id`.
         * @param {DeleteReviewVariables} variables - The {@link DeleteReviewVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the review was deleted by this call and `false` when it was already absent.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteReview({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         */
        deleteReview: ((
            variables: DeleteReviewVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<DeleteResult>) &
            ((
                variables: DeleteReviewVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<DeleteResult>) &
            (<K extends FieldPath<DeleteResult>>(
                variables: DeleteReviewVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<DeleteResult, K>>);

        /**
         * `SaveRecommendationMutation` creates or updates the authenticated user's rating recommending one media for another.
         * @param {SaveRecommendationVariables} variables - The {@link SaveRecommendationVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<RecommendationResponse>} A promise that resolves to the saved {@link RecommendationResponse}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveRecommendation({mediaId: 1, mediaRecommendationId: 2, rating: 'RATE_UP'});
         * ```
         * @see https://docs.anilist.co/reference/object/recommendation
         */
        saveRecommendation: ((
            variables: SaveRecommendationVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<RecommendationResponse>) &
            ((
                variables: SaveRecommendationVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<RecommendationResponse>) &
            (<K extends FieldPath<RecommendationResponse>>(
                variables: SaveRecommendationVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<RecommendationResponse, K>>);

        /**
         * `SaveThreadMutation` creates or updates a forum thread.
         * @param {SaveThreadVariables} variables - The {@link SaveThreadVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ThreadResponse>} A promise that resolves to the saved {@link ThreadResponse}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveThread({
         *   id: 1,
         *   title: 'Hello, world!',
         *   body: 'Hello, world!',
         *   categories: [],
         *   mediaCategories: [],
         *   sticky: false,
         *   locked: false,
         *   asHtml: true,
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/thread
         */
        saveThread: ((
            variables: SaveThreadVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<ThreadResponse>) &
            ((
                variables: SaveThreadVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<ThreadResponse>) &
            (<K extends FieldPath<ThreadResponse>>(
                variables: SaveThreadVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<ThreadResponse, K>>);

        /**
         * `DeleteThreadMutation` deletes a forum thread by `id`.
         * @param {DeleteThreadVariables} variables - The {@link DeleteThreadVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the thread was deleted by this call and `false` when it was already absent.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteThread({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         */
        deleteThread: ((
            variables: DeleteThreadVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<DeleteResult>) &
            ((
                variables: DeleteThreadVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<DeleteResult>) &
            (<K extends FieldPath<DeleteResult>>(
                variables: DeleteThreadVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<DeleteResult, K>>);

        /**
         * `ToggleThreadSubscriptionMutation` subscribes or unsubscribes the authenticated user from a thread.
         * @param {ToggleThreadSubscriptionVariables} variables - The {@link ToggleThreadSubscriptionVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ThreadResponse>} A promise that resolves to the updated {@link ThreadResponse}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleThreadSubscription({threadId: 1, subscribe: true});
         * ```
         * @see https://docs.anilist.co/reference/object/thread
         */
        toggleThreadSubscription: ((
            variables: ToggleThreadSubscriptionVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<ThreadResponse>) &
            ((
                variables: ToggleThreadSubscriptionVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<ThreadResponse>) &
            (<K extends FieldPath<ThreadResponse>>(
                variables: ToggleThreadSubscriptionVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<ThreadResponse, K>>);

        /**
         * `SaveThreadCommentMutation` creates or updates a comment on a thread.
         * @param {SaveThreadCommentVariables} variables - The {@link SaveThreadCommentVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ThreadCommentResponse>} A promise that resolves to the saved {@link ThreadCommentResponse}.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveThreadComment({
         *   id: 1,
         *   threadId: 1,
         *   parentCommentId: 0,
         *   comment: 'Hello, world!',
         *   locked: false,
         *   asHtml: true,
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/threadcomment
         */
        saveThreadComment: ((
            variables: SaveThreadCommentVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<ThreadCommentResponse>) &
            ((
                variables: SaveThreadCommentVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<ThreadCommentResponse>) &
            (<K extends FieldPath<ThreadCommentResponse>>(
                variables: SaveThreadCommentVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<ThreadCommentResponse, K>>);

        /**
         * `DeleteThreadCommentMutation` deletes a thread comment by `id`.
         * @param {DeleteThreadCommentVariables} variables - The {@link DeleteThreadCommentVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the comment was deleted by this call and `false` when it was already absent.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteThreadComment({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         */
        deleteThreadComment: ((
            variables: DeleteThreadCommentVariables,
            options?: RequestOptions & { fields?: undefined }
        ) => Promise<DeleteResult>) &
            ((
                variables: DeleteThreadCommentVariables,
                options: RequestOptions & { fields: undefined }
            ) => Promise<DeleteResult>) &
            (<K extends FieldPath<DeleteResult>>(
                variables: DeleteThreadCommentVariables,
                options: RequestOptions & { fields: readonly K[] | undefined }
            ) => Promise<DeepPick<DeleteResult, K>>);

        /**
         * `UpdateAniChartSettingsMutation` updates the authenticated user's AniChart display settings.
         * @param {UpdateAniChartSettingsVariables} variables - The {@link UpdateAniChartSettingsVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<string>} A promise that resolves to the updated AniChart settings string.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateAniChartSettings({
         *   titleLanguage: 'romaji',
         *   outgoingLinkProvider: 'ANILIST',
         *   theme: 'dark',
         *   sort: 'POPULARITY',
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/anichartuser
         */
        updateAniChartSettings: (
            variables: UpdateAniChartSettingsVariables,
            options?: RequestOptions
        ) => Promise<string>;

        /**
         * `UpdateAniChartHighlightsMutation` sets or clears the authenticated user's AniChart highlights.
         * @param {UpdateAniChartHighlightsVariables} variables - The {@link UpdateAniChartHighlightsVariables} for the mutation.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<string>} A promise that resolves to the updated AniChart highlights string.
         * @throws If the client is unauthenticated, variables fail validation, or the request fails.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateAniChartHighlights({
         *   highlights: {mediaId: 1, highlight: true},
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/anichartuser
         */
        updateAniChartHighlights: (
            variables: UpdateAniChartHighlightsVariables,
            options?: RequestOptions
        ) => Promise<string>;
    };
};
