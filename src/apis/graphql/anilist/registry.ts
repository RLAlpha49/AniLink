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
 * a `fields` selection option is declared per entry (`fieldsEnabled`), as are
 * the always-selected keys used by the facade's narrowing types. The key
 * arrays are the same exported constants the operation classes pass to the
 * document composer, so runtime behavior and generated types share values.
 */
import type { RequestAuthInput, RequestOptions } from "../../../base/transportTypes";
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
import { MediaTrendQuery, MEDIA_TREND_ALWAYS } from "./query/MediaTrend";
import { MediaTrendsQuery } from "./query/page/MediaTrends";
import { MediasQuery } from "./query/page/Medias";
import { NotificationQuery } from "./query/Notification";
import { NotificationsQuery } from "./query/page/Notifications";
import { RecommendationQuery, RECOMMENDATION_ALWAYS } from "./query/Recommendation";
import { RecommendationsQuery } from "./query/page/Recommendations";
import { ReviewQuery, REVIEW_ALWAYS } from "./query/Review";
import { ReviewsQuery } from "./query/page/Reviews";
import { SiteStatisticsQuery, SITE_STATISTICS_ALWAYS } from "./query/SiteStatistics";
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

    /** Keys selected by the operation even when callers request a field subset. */
    readonly alwaysKeys: readonly string[];
}

/** The per-entry options {@link op} and {@link opAs} accept beyond the required arguments. */
interface OperationEntryOptions {
    /**
     * Whether the operation accepts a `fields` selection option. Defaults to
     * `false`; set `true` on every entry whose class composes its document
     * through `schemas/selection/`.
     */
    readonly fieldsEnabled?: boolean;

    /** The operation's shared always-selected-key constant. */
    readonly alwaysKeys?: readonly string[];
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
        alwaysKeys: options?.alwaysKeys ?? [],
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
        alwaysKeys: options?.alwaysKeys ?? [],
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
        op("user", UserQuery, { fieldsEnabled: true, alwaysKeys: USER_ALWAYS }),
        op("media", MediaQuery, { fieldsEnabled: true, alwaysKeys: MEDIA_ALWAYS }),
        op("mediaTrend", MediaTrendQuery, { fieldsEnabled: true, alwaysKeys: MEDIA_TREND_ALWAYS }),
        op("airingSchedule", AiringScheduleQuery, {
            fieldsEnabled: true,
            alwaysKeys: AIRING_SCHEDULE_ALWAYS,
        }),
        op("character", CharacterQuery, { fieldsEnabled: true, alwaysKeys: CHARACTER_ALWAYS }),
        op("staff", StaffQuery, { fieldsEnabled: true, alwaysKeys: STAFF_ALWAYS }),
        op("mediaList", MediaListQuery, { fieldsEnabled: true, alwaysKeys: MEDIA_LIST_ALWAYS }),
        op("mediaListCollection", MediaListCollectionQuery, {
            fieldsEnabled: true,
            alwaysKeys: MEDIA_LIST_COLLECTION_ALWAYS,
        }),
        op("genreCollection", GenreCollectionQuery),
        op("mediaTagCollection", MediaTagCollectionQuery),
        op("viewer", ViewerQuery),
        op("notification", NotificationQuery, { fieldsEnabled: true }),
        op("studio", StudioQuery, { fieldsEnabled: true, alwaysKeys: STUDIO_ALWAYS }),
        op("review", ReviewQuery, { fieldsEnabled: true, alwaysKeys: REVIEW_ALWAYS }),
        op("activity", ActivityQuery, { fieldsEnabled: true }),
        op("activityReply", ActivityReplyQuery),
        op("following", FollowingQuery),
        op("follower", FollowerQuery),
        op("thread", ThreadQuery, { fieldsEnabled: true, alwaysKeys: THREAD_ALWAYS }),
        op("threadComment", ThreadCommentQuery, {
            fieldsEnabled: true,
            alwaysKeys: THREAD_COMMENT_ALWAYS,
        }),
        op("recommendation", RecommendationQuery, {
            fieldsEnabled: true,
            alwaysKeys: RECOMMENDATION_ALWAYS,
        }),
        op("markdown", MarkdownQuery),
        op("aniChartUser", AniChartUserQuery),
        op("siteStatistics", SiteStatisticsQuery, {
            fieldsEnabled: true,
            alwaysKeys: SITE_STATISTICS_ALWAYS,
        }),
        op("externalLinkSourceCollection", ExternalLinkSourceCollectionQuery),
    ],
    page: [
        op("users", UsersQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        op("medias", MediasQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        op("characters", CharactersQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        op("staffs", StaffsQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        op("studios", StudiosQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        op("mediaLists", MediaListsQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        op("airingSchedules", AiringSchedulesQuery, {
            fieldsEnabled: true,
            alwaysKeys: PAGE_ALWAYS,
        }),
        op("mediaTrends", MediaTrendsQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        op("notifications", NotificationsQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        op("followers", FollowersQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        opAs("following", FollowingsQuery, "followings", {
            fieldsEnabled: true,
            alwaysKeys: PAGE_ALWAYS,
        }),
        op("activities", ActivitiesQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        opAs("activityReplies", ActivityRepliesQuery, "activityReplies", {
            fieldsEnabled: true,
            alwaysKeys: PAGE_ALWAYS,
        }),
        op("threads", ThreadsQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        opAs("threadComments", ThreadCommentsQuery, "threadComments", {
            fieldsEnabled: true,
            alwaysKeys: PAGE_ALWAYS,
        }),
        op("reviews", ReviewsQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
        opAs("recommendations", RecommendationsQuery, "recommendations", {
            fieldsEnabled: true,
            alwaysKeys: PAGE_ALWAYS,
        }),
        op("likes", LikesQuery, { fieldsEnabled: true, alwaysKeys: PAGE_ALWAYS }),
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

/** Literal `<category>:<name>` keys for the generator-only operation prose. */
export type RegistryFacadeOperationKey = {
    [
        Category in OperationCategory
    ]: `${Category}:${(typeof ANILIST_OPERATION_REGISTRY)[Category][number]["name"]}`;
}[OperationCategory];

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
