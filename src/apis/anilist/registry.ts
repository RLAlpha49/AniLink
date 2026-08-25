/**
 * Declarative operation registry for the AniList facade.
 *
 * Every operation is one entry in {@link ANILIST_OPERATION_REGISTRY}: the
 * facade key it is exposed under, its category, the operation class that
 * implements it, and the method to bind. `buildAniListWiring` instantiates and
 * binds every entry, so adding an operation touches exactly two sites: this
 * registry and the matching declaration on the group type under `facade/`.
 */
import { ActivityQuery } from "./query/Activity";
import { ActivityReplyQuery } from "./query/ActivityReply";
import { ActivityRepliesQuery } from "./query/page/ActivityReplies";
import { ActivitiesQuery } from "./query/page/Activities";
import { AiringScheduleQuery } from "./query/AiringSchedule";
import { AiringSchedulesQuery } from "./query/page/AiringSchedules";
import { AniChartUserQuery } from "./query/AniChartUser";
import { CharacterQuery } from "./query/Character";
import { CharactersQuery } from "./query/page/Characters";
import { ExternalLinkSourceCollectionQuery } from "./query/ExternalLinkSourceCollection";
import { FollowerQuery } from "./query/Follower";
import { FollowersQuery } from "./query/page/Followers";
import { FollowingQuery } from "./query/Following";
import { FollowingsQuery } from "./query/page/Followings";
import { GenreCollectionQuery } from "./query/GenreCollection";
import { LikesQuery } from "./query/page/Likes";
import { MarkdownQuery } from "./query/Markdown";
import { MediaListCollectionQuery } from "./query/MediaListCollection";
import { MediaListQuery } from "./query/MediaList";
import { MediaListsQuery } from "./query/page/MediaLists";
import { MediaQuery } from "./query/Media";
import { MediaTagCollectionQuery } from "./query/MediaTagCollection";
import { MediaTrendQuery } from "./query/MediaTrend";
import { MediaTrendsQuery } from "./query/page/MediaTrends";
import { MediasQuery } from "./query/page/Medias";
import { NotificationQuery } from "./query/Notification";
import { NotificationsQuery } from "./query/page/Notifications";
import { RecommendationQuery } from "./query/Recommendation";
import { RecommendationsQuery } from "./query/page/Recommendations";
import { ReviewQuery } from "./query/Review";
import { ReviewsQuery } from "./query/page/Reviews";
import { SiteStatisticsQuery } from "./query/SiteStatistics";
import { StaffQuery } from "./query/Staff";
import { StaffsQuery } from "./query/page/Staffs";
import { StudioQuery } from "./query/Studio";
import { StudiosQuery } from "./query/page/Studios";
import { ThreadCommentQuery } from "./query/ThreadComment";
import { ThreadCommentsQuery } from "./query/page/ThreadComments";
import { ThreadQuery } from "./query/Thread";
import { ThreadsQuery } from "./query/page/Threads";
import { UserQuery } from "./query/User";
import { UsersQuery } from "./query/page/Users";
import { ViewerQuery } from "./query/Viewer";
import { DeleteMediaListEntryMutation } from "./mutation/DeleteMediaListEntry";
import { DeleteCustomListMutation } from "./mutation/DeleteCustomList";
import { SaveTextActivityMutation } from "./mutation/SaveTextActivity";
import { SaveMessageActivityMutation } from "./mutation/SaveMessageActivity";
import { SaveListActivityMutation } from "./mutation/SaveListActivity";
import { DeleteActivityMutation } from "./mutation/DeleteActivity";
import { ToggleActivitySubscriptionMutation } from "./mutation/ToggleActivitySubscription";
import { ToggleActivityPinMutation } from "./mutation/ToggleActivityPin";
import { SaveActivityReplyMutation } from "./mutation/SaveActivityReply";
import { DeleteActivityReplyMutation } from "./mutation/DeleteActivityReply";
import { ToggleLikeMutation } from "./mutation/ToggleLike";
import { ToggleLikeV2Mutation } from "./mutation/ToggleLikeV2";
import { ToggleFollowMutation } from "./mutation/ToggleFollow";
import { ToggleFavouriteMutation } from "./mutation/ToggleFavourite";
import { UpdateFavouriteOrderMutation } from "./mutation/UpdateFavouriteOrder";
import { SaveReviewMutation } from "./mutation/SaveReview";
import { RateReviewMutation } from "./mutation/RateReview";
import { DeleteReviewMutation } from "./mutation/DeleteReview";
import { SaveRecommendationMutation } from "./mutation/SaveRecommendation";
import { SaveThreadMutation } from "./mutation/SaveThread";
import { DeleteThreadMutation } from "./mutation/DeleteThread";
import { ToggleThreadSubscriptionMutation } from "./mutation/ToggleThreadSubscription";
import { SaveThreadCommentMutation } from "./mutation/SaveThreadComment";
import { DeleteThreadCommentMutation } from "./mutation/DeleteThreadComment";
import { UpdateAniChartSettingsMutation } from "./mutation/UpdateAniChartSettings";
import { UpdateAniChartHighlightsMutation } from "./mutation/UpdateAniChartHighlights";
import { UpdateMediaListEntriesMutation } from "./mutation/UpdateMediaListEntries";
import { UpdateUserMutation } from "./mutation/UpdateUser";
import { SaveMediaListEntryMutation } from "./mutation/SaveMediaListEntry";

/**
 * The section of the facade an operation is exposed under.
 *
 * - `query` — single-item queries at `aniLink.anilist.query.<key>`.
 * - `page` — paginated queries at `aniLink.anilist.query.page.<key>`.
 * - `mutation` — write operations at `aniLink.anilist.mutation.<key>`.
 */
export type OperationCategory = "query" | "page" | "mutation";

/**
 * One declarative wiring entry.
 *
 * @typeParam TOperation - The operation class implementing this entry.
 */
export interface OperationEntry<TOperation extends new (...args: never[]) => unknown> {
    /**
     * The facade key the bound method is exposed under (e.g. `"media"`).
     */
    readonly name: string;

    /**
     * The operation class. Constructed once per `AniLink` instance with the
     * shared auth token and transport options.
     */
    readonly operationClass: TOperation;

    /**
     * The async method on {@link OperationEntry.operationClass} that is bound
     * and exposed on the facade. Defaults to {@link OperationEntry.name}.
     */
    readonly methodName?: string;
}

/**
 * Convenience constructor for a registry entry whose bound method shares the
 * facade key's name.
 *
 * @param name - The facade key the bound method is exposed under.
 * @param operationClass - The operation class implementing this entry.
 * @returns The registry entry.
 */
function op<TOperation extends new (...args: never[]) => unknown>(
    name: string,
    operationClass: TOperation
): OperationEntry<TOperation> {
    return { name, operationClass };
}

/**
 * Convenience constructor for a registry entry whose bound method differs
 * from the facade key (e.g. `following` exposed via `FollowingsQuery.followings`).
 *
 * @param name - The facade key the bound method is exposed under.
 * @param operationClass - The operation class implementing this entry.
 * @param methodName - The async method on `operationClass` to bind.
 * @returns The registry entry.
 */
function opAs<TOperation extends new (...args: never[]) => unknown>(
    name: string,
    operationClass: TOperation,
    methodName: string
): OperationEntry<TOperation> {
    return { name, operationClass, methodName };
}

/**
 * The shape constraint for registry groups: each group is a readonly tuple of
 * operation entries.
 */
type RegistryGroups = {
    query: readonly OperationEntry<new (...args: never[]) => unknown>[];
    page: readonly OperationEntry<new (...args: never[]) => unknown>[];
    mutation: readonly OperationEntry<new (...args: never[]) => unknown>[];
};

/**
 * The single source of truth for which operations exist and how they are
 * wired into the facade. Order within each group matches the declaration
 * order of the corresponding group type under `facade/`.
 */
export const ANILIST_OPERATION_REGISTRY = {
    query: [
        op("user", UserQuery),
        op("media", MediaQuery),
        op("mediaTrend", MediaTrendQuery),
        op("airingSchedule", AiringScheduleQuery),
        op("character", CharacterQuery),
        op("staff", StaffQuery),
        op("mediaList", MediaListQuery),
        op("mediaListCollection", MediaListCollectionQuery),
        op("genreCollection", GenreCollectionQuery),
        op("mediaTagCollection", MediaTagCollectionQuery),
        op("viewer", ViewerQuery),
        op("notification", NotificationQuery),
        op("studio", StudioQuery),
        op("review", ReviewQuery),
        op("activity", ActivityQuery),
        op("activityReply", ActivityReplyQuery),
        op("following", FollowingQuery),
        op("follower", FollowerQuery),
        op("thread", ThreadQuery),
        op("threadComment", ThreadCommentQuery),
        op("recommendation", RecommendationQuery),
        op("markdown", MarkdownQuery),
        op("aniChartUser", AniChartUserQuery),
        op("siteStatistics", SiteStatisticsQuery),
        op("externalLinkSourceCollection", ExternalLinkSourceCollectionQuery),
    ],
    page: [
        op("users", UsersQuery),
        op("medias", MediasQuery),
        op("characters", CharactersQuery),
        op("staffs", StaffsQuery),
        op("studios", StudiosQuery),
        op("mediaLists", MediaListsQuery),
        op("airingSchedules", AiringSchedulesQuery),
        op("mediaTrends", MediaTrendsQuery),
        op("notifications", NotificationsQuery),
        op("followers", FollowersQuery),
        opAs("following", FollowingsQuery, "followings"),
        op("activities", ActivitiesQuery),
        opAs("activityReplies", ActivityRepliesQuery, "activityReplies"),
        op("threads", ThreadsQuery),
        opAs("threadComments", ThreadCommentsQuery, "threadComments"),
        op("reviews", ReviewsQuery),
        opAs("recommendations", RecommendationsQuery, "recommendations"),
        op("likes", LikesQuery),
    ],
    mutation: [
        op("updateUser", UpdateUserMutation),
        op("saveMediaListEntry", SaveMediaListEntryMutation),
        op("updateMediaListEntries", UpdateMediaListEntriesMutation),
        op("deleteMediaListEntry", DeleteMediaListEntryMutation),
        op("deleteCustomList", DeleteCustomListMutation),
        op("saveTextActivity", SaveTextActivityMutation),
        op("saveMessageActivity", SaveMessageActivityMutation),
        op("saveListActivity", SaveListActivityMutation),
        op("deleteActivity", DeleteActivityMutation),
        op("toggleActivityPin", ToggleActivityPinMutation),
        op("toggleActivitySubscription", ToggleActivitySubscriptionMutation),
        op("saveActivityReply", SaveActivityReplyMutation),
        op("deleteActivityReply", DeleteActivityReplyMutation),
        op("toggleLike", ToggleLikeMutation),
        op("toggleLikeV2", ToggleLikeV2Mutation),
        op("toggleFollow", ToggleFollowMutation),
        op("toggleFavourite", ToggleFavouriteMutation),
        op("updateFavouriteOrder", UpdateFavouriteOrderMutation),
        op("saveReview", SaveReviewMutation),
        op("rateReview", RateReviewMutation),
        op("deleteReview", DeleteReviewMutation),
        op("saveRecommendation", SaveRecommendationMutation),
        op("saveThread", SaveThreadMutation),
        op("deleteThread", DeleteThreadMutation),
        op("toggleThreadSubscription", ToggleThreadSubscriptionMutation),
        op("saveThreadComment", SaveThreadCommentMutation),
        op("deleteThreadComment", DeleteThreadCommentMutation),
        op("updateAniChartSettings", UpdateAniChartSettingsMutation),
        op("updateAniChartHighlights", UpdateAniChartHighlightsMutation),
    ],
} as const satisfies RegistryGroups;
