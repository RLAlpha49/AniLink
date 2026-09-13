/**
 * Declarative operation registry for the AniList facade.
 *
 * Every operation is one entry in {@link ANILIST_OPERATION_REGISTRY}: the
 * facade key it is exposed under, its category, the operation class that
 * implements it, and the method to bind. {@link buildAniListWiring} instantiates and
 * binds every entry, so adding an operation touches exactly two sites: the
 * operation class and its entry in this registry — then run
 * `npm run facade:generate` to refresh the derived group types under
 * `facade/` (curated JSDoc prose lives in
 * `scripts/generate-facade-groups.config.ts`).
 */
import { ActivityQuery } from "./query/Activity";
import { ActivityReplyQuery } from "./query/ActivityReply";
import { ActivityRepliesQuery } from "./query/page/ActivityReplies";
import { ActivitiesQuery } from "./query/page/Activities";
import { AiringScheduleQuery, AIRING_SCHEDULE_ALWAYS } from "./query/AiringSchedule";
import { AiringSchedulesQuery } from "./query/page/AiringSchedules";
import { AniChartUserQuery } from "./query/AniChartUser";
import { CharacterQuery, CHARACTER_ALWAYS } from "./query/Character";
import { CharactersQuery } from "./query/page/Characters";
import { ExternalLinkSourceCollectionQuery } from "./query/ExternalLinkSourceCollection";
import { FollowerQuery } from "./query/Follower";
import { FollowersQuery } from "./query/page/Followers";
import { FollowingQuery } from "./query/Following";
import { FollowingsQuery } from "./query/page/Followings";
import { GenreCollectionQuery } from "./query/GenreCollection";
import { LikesQuery } from "./query/page/Likes";
import { MarkdownQuery } from "./query/Markdown";
import {
    MediaListCollectionQuery,
    MEDIA_LIST_COLLECTION_ALWAYS,
} from "./query/MediaListCollection";
import { MediaListQuery, MEDIA_LIST_ALWAYS } from "./query/MediaList";
import { MediaListsQuery } from "./query/page/MediaLists";
import { MediaQuery, MEDIA_ALWAYS } from "./query/Media";
import { MediaTagCollectionQuery } from "./query/MediaTagCollection";
import { MediaTrendQuery } from "./query/MediaTrend";
import { MediaTrendsQuery } from "./query/page/MediaTrends";
import { MediasQuery } from "./query/page/Medias";
import { NotificationQuery } from "./query/Notification";
import { NotificationsQuery } from "./query/page/Notifications";
import { RecommendationQuery, RECOMMENDATION_ALWAYS } from "./query/Recommendation";
import { RecommendationsQuery } from "./query/page/Recommendations";
import { ReviewQuery, REVIEW_ALWAYS } from "./query/Review";
import { ReviewsQuery } from "./query/page/Reviews";
import { SiteStatisticsQuery } from "./query/SiteStatistics";
import { StaffQuery, STAFF_ALWAYS } from "./query/Staff";
import { StaffsQuery } from "./query/page/Staffs";
import { StudioQuery, STUDIO_ALWAYS } from "./query/Studio";
import { StudiosQuery } from "./query/page/Studios";
import { ThreadCommentQuery, THREAD_COMMENT_ALWAYS } from "./query/ThreadComment";
import { ThreadCommentsQuery } from "./query/page/ThreadComments";
import { ThreadQuery, THREAD_ALWAYS } from "./query/Thread";
import { ThreadsQuery } from "./query/page/Threads";
import { UserQuery, USER_ALWAYS } from "./query/User";
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
import { PAGE_ALWAYS } from "./schemas/selection/fieldsSelection";

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
 * The bound method name is always present on the entry: {@link op} copies the
 * facade key (the common case where the method shares the key's name) and
 * {@link opAs} carries an explicit override. Wiring therefore never falls
 * back to a stringly-typed `name` default — it reads the resolved
 * {@link OperationEntry.methodName} constant directly.
 *
 * @typeParam TOperation - The operation class implementing this entry.
 * @typeParam TName - The literal facade key this entry is exposed under.
 */
export interface OperationEntry<
    TOperation extends new (...args: never[]) => unknown,
    TName extends string = string,
> {
    /**
     * The facade key the bound method is exposed under (e.g. `"media"`).
     * Carried as a literal so the registry can derive exhaustive key unions
     * for compile-time parity checks against the facade group types.
     */
    readonly name: TName;

    /**
     * The operation class. Constructed once per {@link AniLink} instance with the
     * shared auth token and transport options.
     */
    readonly operationClass: TOperation;

    /**
     * The async method on {@link OperationEntry.operationClass} that is bound
     * and exposed on the facade. Always set: {@link op} defaults it to the
     * facade key, {@link opAs} carries an explicit override.
     */
    readonly methodName: string;

    /**
     * Root-level response keys the operation always selects in every composed
     * document, regardless of the `fields` list (e.g. `["id", "idMal"]` for
     * media entities, `["pageInfo"]` for page queries). Absent for operations
     * without a `fields` selection surface and for entities whose response has
     * no always-required key.
     *
     * This is the single source of truth for the always-keys: the operation
     * class reads it at runtime and the facade generator reads it for the
     * `DeepPick` narrowing, so the two can never drift.
     */
    readonly alwaysSelected?: readonly string[];
}

/**
 * Convenience constructor for a registry entry whose bound method shares the
 * facade key's name.
 *
 * @param name - The facade key the bound method is exposed under.
 * @param operationClass - The operation class implementing this entry.
 * @param alwaysSelected - Root-level keys always selected in composed documents.
 * @returns The registry entry with `methodName` defaulted to `name`.
 */
function op<TName extends string, TOperation extends new (...args: never[]) => unknown>(
    name: TName,
    operationClass: TOperation,
    alwaysSelected?: readonly string[]
): OperationEntry<TOperation, TName> {
    return { name, operationClass, methodName: name, alwaysSelected };
}

/**
 * Convenience constructor for a registry entry whose bound method differs
 * from the facade key (e.g. `following` exposed via {@link FollowingsQuery.followings}).
 *
 * @param name - The facade key the bound method is exposed under.
 * @param operationClass - The operation class implementing this entry.
 * @param methodName - The async method on `operationClass` to bind.
 * @param alwaysSelected - Root-level keys always selected in composed documents.
 * @returns The registry entry.
 */
function opAs<TName extends string, TOperation extends new (...args: never[]) => unknown>(
    name: TName,
    operationClass: TOperation,
    methodName: string,
    alwaysSelected?: readonly string[]
): OperationEntry<TOperation, TName> {
    return { name, operationClass, methodName, alwaysSelected };
}

/**
 * The shape constraint for registry groups: each group is a readonly tuple of
 * operation entries.
 */
type RegistryGroups = {
    query: readonly OperationEntry<new (...args: never[]) => unknown, string>[];
    page: readonly OperationEntry<new (...args: never[]) => unknown, string>[];
    mutation: readonly OperationEntry<new (...args: never[]) => unknown, string>[];
};

/**
 * The single source of truth for which operations exist and how they are
 * wired into the facade. Order within each group matches the declaration
 * order of the corresponding group type under `facade/`.
 */
export const ANILIST_OPERATION_REGISTRY = {
    query: [
        op("user", UserQuery, USER_ALWAYS),
        op("media", MediaQuery, MEDIA_ALWAYS),
        op("mediaTrend", MediaTrendQuery),
        op("airingSchedule", AiringScheduleQuery, AIRING_SCHEDULE_ALWAYS),
        op("character", CharacterQuery, CHARACTER_ALWAYS),
        op("staff", StaffQuery, STAFF_ALWAYS),
        op("mediaList", MediaListQuery, MEDIA_LIST_ALWAYS),
        op("mediaListCollection", MediaListCollectionQuery, MEDIA_LIST_COLLECTION_ALWAYS),
        op("genreCollection", GenreCollectionQuery),
        op("mediaTagCollection", MediaTagCollectionQuery),
        op("viewer", ViewerQuery),
        op("notification", NotificationQuery),
        op("studio", StudioQuery, STUDIO_ALWAYS),
        op("review", ReviewQuery, REVIEW_ALWAYS),
        op("activity", ActivityQuery),
        op("activityReply", ActivityReplyQuery),
        op("following", FollowingQuery),
        op("follower", FollowerQuery),
        op("thread", ThreadQuery, THREAD_ALWAYS),
        op("threadComment", ThreadCommentQuery, THREAD_COMMENT_ALWAYS),
        op("recommendation", RecommendationQuery, RECOMMENDATION_ALWAYS),
        op("markdown", MarkdownQuery),
        op("aniChartUser", AniChartUserQuery),
        op("siteStatistics", SiteStatisticsQuery),
        op("externalLinkSourceCollection", ExternalLinkSourceCollectionQuery),
    ],
    page: [
        op("users", UsersQuery, PAGE_ALWAYS),
        op("medias", MediasQuery, PAGE_ALWAYS),
        op("characters", CharactersQuery, PAGE_ALWAYS),
        op("staffs", StaffsQuery, PAGE_ALWAYS),
        op("studios", StudiosQuery, PAGE_ALWAYS),
        op("mediaLists", MediaListsQuery, PAGE_ALWAYS),
        op("airingSchedules", AiringSchedulesQuery, PAGE_ALWAYS),
        op("mediaTrends", MediaTrendsQuery, PAGE_ALWAYS),
        op("notifications", NotificationsQuery),
        op("followers", FollowersQuery, PAGE_ALWAYS),
        opAs("following", FollowingsQuery, "followings", PAGE_ALWAYS),
        op("activities", ActivitiesQuery),
        opAs("activityReplies", ActivityRepliesQuery, "activityReplies", PAGE_ALWAYS),
        op("threads", ThreadsQuery, PAGE_ALWAYS),
        opAs("threadComments", ThreadCommentsQuery, "threadComments", PAGE_ALWAYS),
        op("reviews", ReviewsQuery, PAGE_ALWAYS),
        opAs("recommendations", RecommendationsQuery, "recommendations", PAGE_ALWAYS),
        op("likes", LikesQuery, PAGE_ALWAYS),
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

/**
 * The literal facade keys each registry group exposes, derived from
 * {@link ANILIST_OPERATION_REGISTRY} so the registry stays the single source
 * of truth for which operations exist.
 *
 * The facade group types under `facade/` declare the matching typed surface;
 * each group module asserts parity with a `Record<RegistryXxxKeys, true>`
 * constant so a key present in one but not the other fails `tsc` at compile
 * time, rather than only surfacing at test time.
 */
export type RegistryQueryKeys = (typeof ANILIST_OPERATION_REGISTRY)["query"][number]["name"];
export type RegistryPageKeys = (typeof ANILIST_OPERATION_REGISTRY)["page"][number]["name"];
export type RegistryMutationKeys = (typeof ANILIST_OPERATION_REGISTRY)["mutation"][number]["name"];
