/**
 * Instance construction and namespace assembly for the AniList facade.
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
import { SaveMediaListEntryMutation } from "./mutation/SaveMediaListEntry";
import { SiteStatisticsQuery } from "./query/SiteStatistics";
import { StaffQuery } from "./query/Staff";
import { StaffsQuery } from "./query/page/Staffs";
import { StudioQuery } from "./query/Studio";
import { StudiosQuery } from "./query/page/Studios";
import { ThreadCommentQuery } from "./query/ThreadComment";
import { ThreadCommentsQuery } from "./query/page/ThreadComments";
import { ThreadQuery } from "./query/Thread";
import { ThreadsQuery } from "./query/page/Threads";
import { UpdateMediaListEntriesMutation } from "./mutation/UpdateMediaListEntries";
import { UpdateUserMutation } from "./mutation/UpdateUser";
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
import { CustomRequest } from "./Custom";
import { fuzzyDate } from "./helpers/fuzzyDate";
import { flattenMediaListCollection } from "./helpers/flattenMediaListCollection";
import { paginate, paginatePages, paginateChunks } from "../../base/Paginator";
import { type RequestOptions } from "../../base/RequestHandler";
import type { AniListApi } from "./facade";

/**
 * Builds the AniList facade from the operation classes.
 *
 * @param authToken - The authentication token shared by every operation instance.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @returns The composed AniList API surface.
 */
export function buildAniListWiring(authToken?: string, options?: RequestOptions): AniListApi {
    const customInstance = new CustomRequest(authToken, options);

    const userQueryInstance = new UserQuery(authToken, options);
    const mediaQueryInstance = new MediaQuery(authToken, options);
    const mediaTrendQueryInstance = new MediaTrendQuery(authToken, options);
    const airingScheduleQueryInstance = new AiringScheduleQuery(authToken, options);
    const characterQueryInstance = new CharacterQuery(authToken, options);
    const staffQueryInstance = new StaffQuery(authToken, options);
    const mediaListQueryInstance = new MediaListQuery(authToken, options);
    const mediaListCollectionQueryInstance = new MediaListCollectionQuery(authToken, options);
    const genreCollectionQueryInstance = new GenreCollectionQuery(authToken, options);
    const mediaTagCollectionQueryInstance = new MediaTagCollectionQuery(authToken, options);
    const viewerQueryInstance = new ViewerQuery(authToken, options);
    const notificationQueryInstance = new NotificationQuery(authToken, options);
    const studioQueryInstance = new StudioQuery(authToken, options);
    const reviewQueryInstance = new ReviewQuery(authToken, options);
    const activityQueryInstance = new ActivityQuery(authToken, options);
    const activityReplyQueryInstance = new ActivityReplyQuery(authToken, options);
    const followingQueryInstance = new FollowingQuery(authToken, options);
    const followerQueryInstance = new FollowerQuery(authToken, options);
    const threadQueryInstance = new ThreadQuery(authToken, options);
    const threadCommentQueryInstance = new ThreadCommentQuery(authToken, options);
    const recommendationQueryInstance = new RecommendationQuery(authToken, options);
    const markdownQueryInstance = new MarkdownQuery(authToken, options);
    const aniChartUserQueryInstance = new AniChartUserQuery(authToken, options);
    const siteStatisticsQueryInstance = new SiteStatisticsQuery(authToken, options);
    const externalLinkSourceCollectionQueryInstance = new ExternalLinkSourceCollectionQuery(
        authToken,
        options
    );

    const usersQueryInstance = new UsersQuery(authToken, options);
    const mediasQueryInstance = new MediasQuery(authToken, options);
    const charactersQueryInstance = new CharactersQuery(authToken, options);
    const staffsQueryInstance = new StaffsQuery(authToken, options);
    const studiosQueryInstance = new StudiosQuery(authToken, options);
    const mediaListsQueryInstance = new MediaListsQuery(authToken, options);
    const airingSchedulesQueryInstance = new AiringSchedulesQuery(authToken, options);
    const mediaTrendsQueryInstance = new MediaTrendsQuery(authToken, options);
    const notificationsQueryInstance = new NotificationsQuery(authToken, options);
    const followersQueryInstance = new FollowersQuery(authToken, options);
    const followingsQueryInstance = new FollowingsQuery(authToken, options);
    const activitiesQueryInstance = new ActivitiesQuery(authToken, options);
    const activityRepliesQueryInstance = new ActivityRepliesQuery(authToken, options);
    const threadsQueryInstance = new ThreadsQuery(authToken, options);
    const threadCommentsQueryInstance = new ThreadCommentsQuery(authToken, options);
    const reviewsQueryInstance = new ReviewsQuery(authToken, options);
    const recommendationsQueryInstance = new RecommendationsQuery(authToken, options);
    const likesQueryInstance = new LikesQuery(authToken, options);

    const updateUserMutationInstance = new UpdateUserMutation(authToken, options);
    const saveMediaListEntryMutationInstance = new SaveMediaListEntryMutation(authToken, options);
    const updateMediaListEntriesMutationInstance = new UpdateMediaListEntriesMutation(
        authToken,
        options
    );
    const deleteMediaListEntryMutationInstance = new DeleteMediaListEntryMutation(
        authToken,
        options
    );
    const deleteCustomListMutationInstance = new DeleteCustomListMutation(authToken, options);
    const saveTextActivityMutationInstance = new SaveTextActivityMutation(authToken, options);
    const saveMessageActivityMutationInstance = new SaveMessageActivityMutation(authToken, options);
    const saveListActivityMutationInstance = new SaveListActivityMutation(authToken, options);
    const deleteActivityMutationInstance = new DeleteActivityMutation(authToken, options);
    const toggleActivityPinMutationInstance = new ToggleActivityPinMutation(authToken, options);
    const toggleActivitySubscriptionMutationInstance = new ToggleActivitySubscriptionMutation(
        authToken,
        options
    );
    const saveActivityReplyMutationInstance = new SaveActivityReplyMutation(authToken, options);
    const deleteActivityReplyMutationInstance = new DeleteActivityReplyMutation(authToken, options);
    const toggleLikeMutationInstance = new ToggleLikeMutation(authToken, options);
    const toggleLikeV2MutationInstance = new ToggleLikeV2Mutation(authToken, options);
    const toggleFollowMutationInstance = new ToggleFollowMutation(authToken, options);
    const toggleFavouriteMutationInstance = new ToggleFavouriteMutation(authToken, options);
    const updateFavouriteOrderMutationInstance = new UpdateFavouriteOrderMutation(
        authToken,
        options
    );
    const saveReviewMutationInstance = new SaveReviewMutation(authToken, options);
    const rateReviewMutationInstance = new RateReviewMutation(authToken, options);
    const deleteReviewMutationInstance = new DeleteReviewMutation(authToken, options);
    const saveRecommendationMutationInstance = new SaveRecommendationMutation(authToken, options);
    const saveThreadMutationInstance = new SaveThreadMutation(authToken, options);
    const deleteThreadMutationInstance = new DeleteThreadMutation(authToken, options);
    const toggleThreadSubscriptionMutationInstance = new ToggleThreadSubscriptionMutation(
        authToken,
        options
    );
    const saveThreadCommentMutationInstance = new SaveThreadCommentMutation(authToken, options);
    const deleteThreadCommentMutationInstance = new DeleteThreadCommentMutation(authToken, options);
    const updateAniChartSettingsMutationInstance = new UpdateAniChartSettingsMutation(
        authToken,
        options
    );
    const updateAniChartHighlightsMutationInstance = new UpdateAniChartHighlightsMutation(
        authToken,
        options
    );

    return {
        custom: customInstance.custom.bind(customInstance),
        query: {
            user: userQueryInstance.user.bind(userQueryInstance),
            media: mediaQueryInstance.media.bind(mediaQueryInstance),
            mediaTrend: mediaTrendQueryInstance.mediaTrend.bind(mediaTrendQueryInstance),
            airingSchedule: airingScheduleQueryInstance.airingSchedule.bind(
                airingScheduleQueryInstance
            ),
            character: characterQueryInstance.character.bind(characterQueryInstance),
            staff: staffQueryInstance.staff.bind(staffQueryInstance),
            mediaList: mediaListQueryInstance.mediaList.bind(mediaListQueryInstance),
            mediaListCollection: mediaListCollectionQueryInstance.mediaListCollection.bind(
                mediaListCollectionQueryInstance
            ),
            genreCollection: genreCollectionQueryInstance.genreCollection.bind(
                genreCollectionQueryInstance
            ),
            mediaTagCollection: mediaTagCollectionQueryInstance.mediaTagCollection.bind(
                mediaTagCollectionQueryInstance
            ),
            viewer: viewerQueryInstance.viewer.bind(viewerQueryInstance),
            notification: notificationQueryInstance.notification.bind(notificationQueryInstance),
            studio: studioQueryInstance.studio.bind(studioQueryInstance),
            review: reviewQueryInstance.review.bind(reviewQueryInstance),
            activity: activityQueryInstance.activity.bind(activityQueryInstance),
            activityReply: activityReplyQueryInstance.activityReply.bind(
                activityReplyQueryInstance
            ),
            following: followingQueryInstance.following.bind(followingQueryInstance),
            follower: followerQueryInstance.follower.bind(followerQueryInstance),
            thread: threadQueryInstance.thread.bind(threadQueryInstance),
            threadComment: threadCommentQueryInstance.threadComment.bind(
                threadCommentQueryInstance
            ),
            recommendation: recommendationQueryInstance.recommendation.bind(
                recommendationQueryInstance
            ),
            markdown: markdownQueryInstance.markdown.bind(markdownQueryInstance),
            aniChartUser: aniChartUserQueryInstance.aniChartUser.bind(aniChartUserQueryInstance),
            siteStatistics: siteStatisticsQueryInstance.siteStatistics.bind(
                siteStatisticsQueryInstance
            ),
            externalLinkSourceCollection:
                externalLinkSourceCollectionQueryInstance.externalLinkSourceCollection.bind(
                    externalLinkSourceCollectionQueryInstance
                ),

            page: {
                users: usersQueryInstance.users.bind(usersQueryInstance),
                medias: mediasQueryInstance.medias.bind(mediasQueryInstance),
                characters: charactersQueryInstance.characters.bind(charactersQueryInstance),
                staffs: staffsQueryInstance.staffs.bind(staffsQueryInstance),
                studios: studiosQueryInstance.studios.bind(studiosQueryInstance),
                mediaLists: mediaListsQueryInstance.mediaLists.bind(mediaListsQueryInstance),
                airingSchedules: airingSchedulesQueryInstance.airingSchedules.bind(
                    airingSchedulesQueryInstance
                ),
                mediaTrends: mediaTrendsQueryInstance.mediaTrends.bind(mediaTrendsQueryInstance),
                notifications: notificationsQueryInstance.notifications.bind(
                    notificationsQueryInstance
                ),
                followers: followersQueryInstance.followers.bind(followersQueryInstance),
                following: followingsQueryInstance.followings.bind(followingsQueryInstance),
                activities: activitiesQueryInstance.activities.bind(activitiesQueryInstance),
                activityReplies: activityRepliesQueryInstance.activityReplies.bind(
                    activityRepliesQueryInstance
                ),
                threads: threadsQueryInstance.threads.bind(threadsQueryInstance),
                threadComments: threadCommentsQueryInstance.threadComments.bind(
                    threadCommentsQueryInstance
                ),
                reviews: reviewsQueryInstance.reviews.bind(reviewsQueryInstance),
                recommendations: recommendationsQueryInstance.recommendations.bind(
                    recommendationsQueryInstance
                ),
                likes: likesQueryInstance.likes.bind(likesQueryInstance),
            },
        },
        mutation: {
            updateUser: updateUserMutationInstance.updateUser.bind(updateUserMutationInstance),
            saveMediaListEntry: saveMediaListEntryMutationInstance.saveMediaListEntry.bind(
                saveMediaListEntryMutationInstance
            ),
            updateMediaListEntries:
                updateMediaListEntriesMutationInstance.updateMediaListEntries.bind(
                    updateMediaListEntriesMutationInstance
                ),
            deleteMediaListEntry: deleteMediaListEntryMutationInstance.deleteMediaListEntry.bind(
                deleteMediaListEntryMutationInstance
            ),
            deleteCustomList: deleteCustomListMutationInstance.deleteCustomList.bind(
                deleteCustomListMutationInstance
            ),
            saveTextActivity: saveTextActivityMutationInstance.saveTextActivity.bind(
                saveTextActivityMutationInstance
            ),
            saveMessageActivity: saveMessageActivityMutationInstance.saveMessageActivity.bind(
                saveMessageActivityMutationInstance
            ),
            saveListActivity: saveListActivityMutationInstance.saveListActivity.bind(
                saveListActivityMutationInstance
            ),
            deleteActivity: deleteActivityMutationInstance.deleteActivity.bind(
                deleteActivityMutationInstance
            ),
            toggleActivityPin: toggleActivityPinMutationInstance.toggleActivityPin.bind(
                toggleActivityPinMutationInstance
            ),
            toggleActivitySubscription:
                toggleActivitySubscriptionMutationInstance.toggleActivitySubscription.bind(
                    toggleActivitySubscriptionMutationInstance
                ),
            saveActivityReply: saveActivityReplyMutationInstance.saveActivityReply.bind(
                saveActivityReplyMutationInstance
            ),
            deleteActivityReply: deleteActivityReplyMutationInstance.deleteActivityReply.bind(
                deleteActivityReplyMutationInstance
            ),
            toggleLike: toggleLikeMutationInstance.toggleLike.bind(toggleLikeMutationInstance),
            toggleLikeV2: toggleLikeV2MutationInstance.toggleLikeV2.bind(
                toggleLikeV2MutationInstance
            ),
            toggleFollow: toggleFollowMutationInstance.toggleFollow.bind(
                toggleFollowMutationInstance
            ),
            toggleFavourite: toggleFavouriteMutationInstance.toggleFavourite.bind(
                toggleFavouriteMutationInstance
            ),
            updateFavouriteOrder: updateFavouriteOrderMutationInstance.updateFavouriteOrder.bind(
                updateFavouriteOrderMutationInstance
            ),
            saveReview: saveReviewMutationInstance.saveReview.bind(saveReviewMutationInstance),
            rateReview: rateReviewMutationInstance.rateReview.bind(rateReviewMutationInstance),
            deleteReview: deleteReviewMutationInstance.deleteReview.bind(
                deleteReviewMutationInstance
            ),
            saveRecommendation: saveRecommendationMutationInstance.saveRecommendation.bind(
                saveRecommendationMutationInstance
            ),
            saveThread: saveThreadMutationInstance.saveThread.bind(saveThreadMutationInstance),
            deleteThread: deleteThreadMutationInstance.deleteThread.bind(
                deleteThreadMutationInstance
            ),
            toggleThreadSubscription:
                toggleThreadSubscriptionMutationInstance.toggleThreadSubscription.bind(
                    toggleThreadSubscriptionMutationInstance
                ),
            saveThreadComment: saveThreadCommentMutationInstance.saveThreadComment.bind(
                saveThreadCommentMutationInstance
            ),
            deleteThreadComment: deleteThreadCommentMutationInstance.deleteThreadComment.bind(
                deleteThreadCommentMutationInstance
            ),
            updateAniChartSettings:
                updateAniChartSettingsMutationInstance.updateAniChartSettings.bind(
                    updateAniChartSettingsMutationInstance
                ),
            updateAniChartHighlights:
                updateAniChartHighlightsMutationInstance.updateAniChartHighlights.bind(
                    updateAniChartHighlightsMutationInstance
                ),
        },
        paginate,
        paginatePages,
        paginateChunks,
        fuzzyDate,
        flattenMediaListCollection,
    };
}
