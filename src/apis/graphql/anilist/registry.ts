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
 * `scripts/generate-facade-groups.config.ts`). Whether an operation accepts
 * a `fields` selection option is declared per entry (`fieldsEnabled`); the
 * facade generator cross-checks the flag against the class's
 * `schemas/selection/` imports and fails generation on disagreement. The
 * always-keys each operation selects in every composed document are
 * declared once, by the operation class itself (its exported `_ALWAYS`
 * constant, or the shared `PAGE_ALWAYS` for page queries); the facade
 * generator parses them from the class, so this registry carries no
 * duplicate of them.
 */
import type { RequestAuthInput, RequestOptions } from "../../../base/transportTypes";
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
 * The constructor contract every registered operation class must satisfy:
 * the shared `BaseOperation` constructor shape the wiring invokes with
 * `(authToken, options, stateOwner)`.
 *
 * Constraining the registry to this shape (instead of an opaque
 * `new (...args: never[]) => unknown`) makes the compiler enforce the
 * contract at registry-definition time: an operation class whose own
 * constructor drops the third parameter fails typecheck here instead of
 * silently losing the shared per-client resilience state at runtime.
 */
export type OperationConstructor = new (
    authToken?: RequestAuthInput,
    options?: RequestOptions,
    stateOwner?: object
) => unknown;

/**
 * One declarative wiring entry.
 *
 * The bound method name is always present on the entry: `op` copies the
 * facade key (the common case where the method shares the key's name) and
 * `opAs` carries an explicit override. Wiring therefore never falls
 * back to a stringly-typed `name` default — it reads the resolved
 * {@link OperationEntry.methodName} constant directly.
 *
 * @typeParam TOperation - The operation class implementing this entry; must
 * satisfy the shared {@link OperationConstructor} contract.
 * @typeParam TName - The literal facade key this entry is exposed under.
 */
export interface OperationEntry<
    TOperation extends OperationConstructor,
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
     * and exposed on the facade. Always set: `op` defaults it to the
     * facade key, `opAs` carries an explicit override.
     */
    readonly methodName: string;

    /**
     * Whether the operation accepts a `fields` selection option and therefore
     * gets the three-overload treatment in the generated facade groups.
     *
     * Declared here instead of inferred from the operation class's imports so
     * the fields-enabled set is discoverable from the registry itself; the
     * facade generator cross-checks the flag against the class's
     * `schemas/selection/` imports and fails generation on disagreement.
     */
    readonly fieldsEnabled: boolean;
}

/** The per-entry options {@link op} and {@link opAs} accept beyond the required arguments. */
interface OperationEntryOptions {
    /**
     * Whether the operation accepts a `fields` selection option. Defaults to
     * `false`; set `true` on every entry whose class composes its document
     * through `schemas/selection/`.
     */
    readonly fieldsEnabled?: boolean;
}

/**
 * Convenience constructor for a registry entry whose bound method shares the
 * facade key's name.
 *
 * @param name - The facade key the bound method is exposed under.
 * @param operationClass - The operation class implementing this entry.
 * @param options - Per-entry options; `options.fieldsEnabled` defaults to `false`.
 * @returns The registry entry with `methodName` defaulted to `name`.
 */
function op<TName extends string, TOperation extends OperationConstructor>(
    name: TName,
    operationClass: TOperation,
    options?: OperationEntryOptions
): OperationEntry<TOperation, TName> {
    return {
        name,
        operationClass,
        methodName: name,
        fieldsEnabled: options?.fieldsEnabled ?? false,
    };
}

/**
 * Convenience constructor for a registry entry whose bound method differs
 * from the facade key (e.g. `following` exposed via {@link FollowingsQuery.followings}).
 *
 * @param name - The facade key the bound method is exposed under.
 * @param operationClass - The operation class implementing this entry.
 * @param methodName - The async method on `operationClass` to bind.
 * @param options - Per-entry options; `options.fieldsEnabled` defaults to `false`.
 * @returns The registry entry.
 */
function opAs<TName extends string, TOperation extends OperationConstructor>(
    name: TName,
    operationClass: TOperation,
    methodName: string,
    options?: OperationEntryOptions
): OperationEntry<TOperation, TName> {
    return {
        name,
        operationClass,
        methodName,
        fieldsEnabled: options?.fieldsEnabled ?? false,
    };
}

/**
 * The shape constraint for registry groups: each group is a readonly tuple of
 * operation entries.
 */
type RegistryGroups = {
    query: readonly OperationEntry<OperationConstructor, string>[];
    page: readonly OperationEntry<OperationConstructor, string>[];
    mutation: readonly OperationEntry<OperationConstructor, string>[];
};

/**
 * The single source of truth for which operations exist and how they are
 * wired into the facade. Order within each group matches the declaration
 * order of the corresponding group type under `facade/`.
 */
export const ANILIST_OPERATION_REGISTRY = {
    query: [
        op("user", UserQuery, { fieldsEnabled: true }),
        op("media", MediaQuery, { fieldsEnabled: true }),
        op("mediaTrend", MediaTrendQuery, { fieldsEnabled: true }),
        op("airingSchedule", AiringScheduleQuery, { fieldsEnabled: true }),
        op("character", CharacterQuery, { fieldsEnabled: true }),
        op("staff", StaffQuery, { fieldsEnabled: true }),
        op("mediaList", MediaListQuery, { fieldsEnabled: true }),
        op("mediaListCollection", MediaListCollectionQuery, { fieldsEnabled: true }),
        op("genreCollection", GenreCollectionQuery),
        op("mediaTagCollection", MediaTagCollectionQuery),
        op("viewer", ViewerQuery),
        op("notification", NotificationQuery, { fieldsEnabled: true }),
        op("studio", StudioQuery, { fieldsEnabled: true }),
        op("review", ReviewQuery, { fieldsEnabled: true }),
        op("activity", ActivityQuery, { fieldsEnabled: true }),
        op("activityReply", ActivityReplyQuery),
        op("following", FollowingQuery),
        op("follower", FollowerQuery),
        op("thread", ThreadQuery, { fieldsEnabled: true }),
        op("threadComment", ThreadCommentQuery, { fieldsEnabled: true }),
        op("recommendation", RecommendationQuery, { fieldsEnabled: true }),
        op("markdown", MarkdownQuery),
        op("aniChartUser", AniChartUserQuery),
        op("siteStatistics", SiteStatisticsQuery, { fieldsEnabled: true }),
        op("externalLinkSourceCollection", ExternalLinkSourceCollectionQuery),
    ],
    page: [
        op("users", UsersQuery, { fieldsEnabled: true }),
        op("medias", MediasQuery, { fieldsEnabled: true }),
        op("characters", CharactersQuery, { fieldsEnabled: true }),
        op("staffs", StaffsQuery, { fieldsEnabled: true }),
        op("studios", StudiosQuery, { fieldsEnabled: true }),
        op("mediaLists", MediaListsQuery, { fieldsEnabled: true }),
        op("airingSchedules", AiringSchedulesQuery, { fieldsEnabled: true }),
        op("mediaTrends", MediaTrendsQuery, { fieldsEnabled: true }),
        op("notifications", NotificationsQuery, { fieldsEnabled: true }),
        op("followers", FollowersQuery, { fieldsEnabled: true }),
        opAs("following", FollowingsQuery, "followings", { fieldsEnabled: true }),
        op("activities", ActivitiesQuery, { fieldsEnabled: true }),
        opAs("activityReplies", ActivityRepliesQuery, "activityReplies", { fieldsEnabled: true }),
        op("threads", ThreadsQuery, { fieldsEnabled: true }),
        opAs("threadComments", ThreadCommentsQuery, "threadComments", { fieldsEnabled: true }),
        op("reviews", ReviewsQuery, { fieldsEnabled: true }),
        opAs("recommendations", RecommendationsQuery, "recommendations", { fieldsEnabled: true }),
        op("likes", LikesQuery, { fieldsEnabled: true }),
    ],
    mutation: [
        op("updateUser", UpdateUserMutation, { fieldsEnabled: true }),
        op("saveMediaListEntry", SaveMediaListEntryMutation, { fieldsEnabled: true }),
        op("updateMediaListEntries", UpdateMediaListEntriesMutation, { fieldsEnabled: true }),
        op("deleteMediaListEntry", DeleteMediaListEntryMutation, { fieldsEnabled: true }),
        op("deleteCustomList", DeleteCustomListMutation, { fieldsEnabled: true }),
        op("saveTextActivity", SaveTextActivityMutation, { fieldsEnabled: true }),
        op("saveMessageActivity", SaveMessageActivityMutation, { fieldsEnabled: true }),
        op("saveListActivity", SaveListActivityMutation, { fieldsEnabled: true }),
        op("deleteActivity", DeleteActivityMutation, { fieldsEnabled: true }),
        op("toggleActivityPin", ToggleActivityPinMutation, { fieldsEnabled: true }),
        op("toggleActivitySubscription", ToggleActivitySubscriptionMutation, {
            fieldsEnabled: true,
        }),
        op("saveActivityReply", SaveActivityReplyMutation, { fieldsEnabled: true }),
        op("deleteActivityReply", DeleteActivityReplyMutation, { fieldsEnabled: true }),
        op("toggleLike", ToggleLikeMutation, { fieldsEnabled: true }),
        op("toggleLikeV2", ToggleLikeV2Mutation, { fieldsEnabled: true }),
        op("toggleFollow", ToggleFollowMutation, { fieldsEnabled: true }),
        op("toggleFavourite", ToggleFavouriteMutation, { fieldsEnabled: true }),
        op("updateFavouriteOrder", UpdateFavouriteOrderMutation, { fieldsEnabled: true }),
        op("saveReview", SaveReviewMutation, { fieldsEnabled: true }),
        op("rateReview", RateReviewMutation, { fieldsEnabled: true }),
        op("deleteReview", DeleteReviewMutation, { fieldsEnabled: true }),
        op("saveRecommendation", SaveRecommendationMutation, { fieldsEnabled: true }),
        op("saveThread", SaveThreadMutation, { fieldsEnabled: true }),
        op("deleteThread", DeleteThreadMutation, { fieldsEnabled: true }),
        op("toggleThreadSubscription", ToggleThreadSubscriptionMutation, { fieldsEnabled: true }),
        op("saveThreadComment", SaveThreadCommentMutation, { fieldsEnabled: true }),
        op("deleteThreadComment", DeleteThreadCommentMutation, { fieldsEnabled: true }),
        op("updateAniChartSettings", UpdateAniChartSettingsMutation),
        op("updateAniChartHighlights", UpdateAniChartHighlightsMutation),
    ],
} as const satisfies RegistryGroups;

/**
 * The literal facade keys the `query` registry group exposes, derived from
 * {@link ANILIST_OPERATION_REGISTRY} so the registry stays the single source
 * of truth for which operations exist.
 *
 * The facade group types under `facade/` declare the matching typed surface;
 * each group module asserts bidirectional parity between this union and its
 * facade keys, so a key present in one but not the other fails `tsc` at
 * compile time, rather than only surfacing at test time.
 */
export type RegistryQueryKeys = (typeof ANILIST_OPERATION_REGISTRY)["query"][number]["name"];
/**
 * The literal facade keys the `page` registry group exposes, derived from
 * {@link ANILIST_OPERATION_REGISTRY} so the registry stays the single source
 * of truth for which operations exist.
 *
 * The `query-group` facade module asserts bidirectional parity between this
 * union and `keyof AniListQueries["query"]["page"]`, so a key present in
 * one but not the other fails `tsc` at compile time, rather than only
 * surfacing at test time.
 */
export type RegistryPageKeys = (typeof ANILIST_OPERATION_REGISTRY)["page"][number]["name"];
/**
 * The literal facade keys the `mutation` registry group exposes, derived
 * from {@link ANILIST_OPERATION_REGISTRY} so the registry stays the single
 * source of truth for which operations exist.
 *
 * The `mutation-group` facade module asserts bidirectional parity between
 * this union and `keyof AniListMutations["mutation"]`, so a key present in
 * one but not the other fails `tsc` at compile time, rather than only
 * surfacing at test time.
 */
export type RegistryMutationKeys = (typeof ANILIST_OPERATION_REGISTRY)["mutation"][number]["name"];
