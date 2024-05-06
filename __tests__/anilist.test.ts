require('dotenv').config()
import AniLink from '../dist/AniLink.js'
// import AniLink from '../src/AniLink'

import {RecommendationResponse} from "../src/apis/anilist/interfaces/responses/query/Recommendation"
import {ThreadCommentResponse} from "../src/apis/anilist/interfaces/responses/query/ThreadComment"
import {ThreadResponse} from "../src/apis/anilist/interfaces/responses/query/Thread"
import {UserResponse} from "../src/apis/anilist/interfaces/responses/query/User"
import {Activity, ActivityReply} from "../src/apis/anilist/interfaces/Activity"
import {ReviewResponse} from "../src/apis/anilist/interfaces/responses/query/Review"
import {StudioResponse} from "../src/apis/anilist/interfaces/responses/query/Studio"
import {NotificationResponse} from "../src/apis/anilist/interfaces/responses/query/Notification"
import {MediaTagCollectionResponse} from "../src/apis/anilist/interfaces/responses/query/MediaTagCollection"
import {MediaListResponse} from "../src/apis/anilist/interfaces/responses/query/MediaList"
import {StaffResponse} from "../src/apis/anilist/interfaces/responses/query/Staff"
import {CharacterResponse} from "../src/apis/anilist/interfaces/responses/query/Character"
import {AiringScheduleResponse} from "../src/apis/anilist/interfaces/responses/query/AiringSchedule"
import {MediaListCollectionResponse} from "../src/apis/anilist/interfaces/responses/query/MediaListCollectionResponse"
import {MediaTrendResponse} from "../src/apis/anilist/interfaces/responses/query/MediaTrend"
import {MediaResponse} from "../src/apis/anilist/interfaces/responses/query/Media"
import {AniChartUserResponse} from "../src/apis/anilist/interfaces/responses/query/AniChartUser"
import {SiteStatisticsResponse} from "../src/apis/anilist/interfaces/responses/query/SiteStatistics";
import {ExternalLinkSourceCollectionQuery} from "../src/apis/anilist/query/ExternalLinkSourceCollection";
import { BasicUser } from '../src/apis/anilist/interfaces/Basic.js'

async function handleRateLimit(apiCall: () => Promise<any>, retryAfter = 60) {
  try {
    let response;
    try {
      response = await apiCall();
    } catch (error) {
      throw error;
    }
    console.log(response.data);
    return response;
  } catch (error: any) {
    if (error.response && error.response.status === 429) {
      console.log('Rate limit exceeded, waiting for 1 minute before retrying...');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      console.log('Retrying...');
      return handleRateLimit(apiCall, retryAfter);
    } else {
      if (error.response && error.response.data) {
        throw error.response.data;
      } else {
        throw error.response || error;
      }
    }
  }
}

describe('Anilist API query', () => {
  let aniLink: AniLink
  let aniLink2: AniLink

  beforeEach(() => {
    const token = process.env.ANILIST_TOKEN
    if (!token) {
      throw new Error('ANILIST_TOKEN is not defined')
    }
    aniLink = new AniLink(token)
    aniLink2 = new AniLink()
  })

  test('User query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.user({id: 542244, isHTML: true}))
    expect(response).toBeDefined()
    return response.data.User
  })

  test('Media query', async (): Promise<MediaResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.media({id: 1, type: 'ANIME'}))
    expect(response).toBeDefined()
    return response.data.Media
  })

  test('Media Trend query', async (): Promise<MediaTrendResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.mediaTrend({mediaId: 1, type: 'ANIME'}))
    expect(response).toBeDefined()
    return response.data.MediaTrend
  })

  test('Airing Schedule query', async (): Promise<AiringScheduleResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.airingSchedule({mediaId: 130590})) // id needs to be an airing anime
    expect(response).toBeDefined()
    return response.data.AiringSchedule

  })

  test('Character query', async (): Promise<CharacterResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.character({
      asHtml: true,
      mediaSort: ['POPULARITY_DESC'],
      mediaOnList: true,
      mediaPage: 1,
      mediaPerPage: 10,
      search: 'Rimuru Tempest'
    }))
    expect(response).toBeDefined()
    return response.data.Character
  })

  test('Staff query', async (): Promise<StaffResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.staff({
      id: 132186,
      asHtml: true,
      staffMediaSort: ['POPULARITY_DESC'],
      staffMediaType: 'ANIME',
      staffMediaOnList: true,
      staffMediaPage: 1,
      staffMediaPerPage: 10,
      charactersSort: ['ID'],
      charactersPage: 1,
      charactersPerPage: 10,
      characterMediaSort: ['POPULARITY_DESC'],
      characterMediaOnList: true,
      characterMediaPage: 1,
      characterMediaPerPage: 10
    }))
    expect(response).toBeDefined()
    return response.data.Staff
  })

  test('Media List query', async (): Promise<MediaListResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.mediaList({userId: 6503722}))
    expect(response).toBeDefined()
    return response.data.MediaList
  })

  test('Media List Collection query', async (): Promise<MediaListCollectionResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.mediaListCollection({
      userId: 542244,
      type: 'ANIME',
      status: 'COMPLETED',
      chunk: 1,
      perChunk: 10000
    }))
    expect(response).toBeDefined()
    return response.data.MediaListCollection
  })

  test('Genre Collection query', async (): Promise<String> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.genreCollection())
    expect(response).toBeDefined()
    return response.data.GenreCollection
  })

  test('Media Tag Collection query', async (): Promise<MediaTagCollectionResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.mediaTagCollection())
    expect(response).toBeDefined()
    return response.data.MediaTagCollection
  })

  test('Viewer query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.viewer({isHTML: true}))
    expect(response).toBeDefined()
    return response.data.Viewer
  })

  test('Notification query', async (): Promise<NotificationResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.notification({asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Notification
  })

  test('Studio query', async (): Promise<StudioResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.studio({id: 561, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Studio
  })

  test('Review query', async (): Promise<ReviewResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.review({id: 8008, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Review
  })

  test('Activity query', async (): Promise<Activity> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.activity({id: 723235883, asHtml: true, type_not: 'TEXT', sort: ['ID_DESC', 'PINNED']}))
    expect(response).toBeDefined()
    return response.data.Activity
  })

  test('Activity Reply query', async (): Promise<ActivityReply> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.activityReply({id: 12191046, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.ActivityReply
  })

  test('Following query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.following({userId: 542244, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Following
  })

  test('Follower query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.follower({userId: 542244, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Follower
  })

  test('Thread query', async (): Promise<ThreadResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.thread({id: 71881, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Thread
  })

  test('Thread Comment query', async (): Promise<ThreadCommentResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.threadComment({id: 2555166, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.ThreadComment
  })

  test('Reccomendation query', async (): Promise<RecommendationResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.recommendation({mediaId: 156822, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Recommendation
  })

  test('Markdown query', async (): Promise<String> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.markdown({markdown: 'Hello'}))
    expect(response).toBeDefined()
    return response.data.Markdown.html
  })

  test('AniChartUser query', async (): Promise<AniChartUserResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.aniChartUser())
    expect(response).toBeDefined()
    return response.data.AniChartUser
  })

  test('Site Statistics query', async (): Promise<SiteStatisticsResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.siteStatistics())
    expect(response).toBeDefined()
    return response.data.SiteStatistics
  })

  test('External Link Source Collection query', async (): Promise<ExternalLinkSourceCollectionQuery> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.externalLinkSourceCollection())
    expect(response).toBeDefined()
    return response.data.ExternalLinkSourceCollection
  })


  test('Users Page query', async (): Promise<BasicUser> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.users({isHTML: true}))
    expect(response).toBeDefined()
    return response.data.Page.users
  })

  test('Media Page query', async (): Promise<MediaResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.medias({id: 1, type: 'ANIME'}))
    expect(response).toBeDefined()
    return response.data.Page.media
  })

  test('Character Page query', async (): Promise<CharacterResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.characters({id: 1, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.characters
  })

  test('Staff Page query', async (): Promise<StaffResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.staffs({id: 132186, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.staff
  })

  test('Studio Page query', async (): Promise<StudioResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.studios({asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.studios
  })

  test('Media List Page query', async (): Promise<MediaListResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.mediaLists({userId: 542244}))
    expect(response).toBeDefined()
    return response.data.Page.mediaList
  })

  test('Airing Schedule Page query', async (): Promise<AiringScheduleResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.airingSchedules({type: 'ANIME'}))
    expect(response).toBeDefined()
    return response.data.Page.airingSchedules
  })

  test('Media Trend Page query', async (): Promise<MediaTrendResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.mediaTrends({type: 'ANIME'}))
    expect(response).toBeDefined()
    return response.data.Page.mediaTrends
  })

  test('Notification Page query', async (): Promise<NotificationResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.notifications({asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.notifications
  })

  test('Follower Page query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.followers({userId: 542244, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.followers
  })

  test('Following Page query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.following({userId: 542244, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.following
  })

  test('Activity Page query', async (): Promise<Activity> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.activities({id: 723235883, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.activities
  })

  test('Activity Reply Page query', async (): Promise<ActivityReply> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.activityReplies({
      id: 12191046,
      asHtml: true
    }))
    expect(response).toBeDefined()
    return response.data.Page.activityReplies
  })

  test('Thread Page query', async (): Promise<ThreadResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.threads({id: 71881, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.threads
  })

  test('Thread Comment Page query', async (): Promise<ThreadCommentResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.threadComments({
      threadId: 71881,
      asHtml: true
    }))
    expect(response).toBeDefined()
    return response.data.Page.threadComments
  })

  test('Review Page query', async (): Promise<ReviewResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.reviews({id: 8008, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.reviews
  })

  test('Recommendation Page query', async (): Promise<RecommendationResponse> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.recommendations({
      mediaId: 156822,
      asHtml: true
    }))
    expect(response).toBeDefined()
    return response.data.Page.recommendations
  })

  test('Likes Page query', async (): Promise<BasicUser> => {
    const response = await handleRateLimit(() => aniLink2.anilist.query.page.likes({
      likeableId: 723422275,
      type: 'ACTIVITY',
      asHtml: true
    }))
    expect(response).toBeDefined()
    return response.data.Page.likes
  })
})

describe('Anilist API mutation', () => {
  let aniLink: AniLink

  beforeEach(() => {
    const token = process.env.ANILIST_TOKEN
    if (!token) {
      throw new Error('ANILIST_TOKEN is not defined')
    }
    aniLink = new AniLink(token)
  })

  test('Update User', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.mutation.updateUser({
      about: 'New about text',
      titleLanguage: 'ENGLISH',
      displayAdultContent: true,
      airingNotifications: true,
      scoreFormat: 'POINT_10',
      rowOrder: 'title',
      profileColor: 'blue',
      donatorBadge: 'Supporter',
      notificationOptions: [{type: 'AIRING', enabled: true}],
      timezone: '-06:00',
      activityMergeTime: 30,
      animeListOptions: {sectionOrder: ['title'], customLists: ['test'], advancedScoring: [], advancedScoringEnabled: false},
      mangaListOptions: {sectionOrder: ['title'], customLists: ['test'], advancedScoring: [], advancedScoringEnabled: false},
      staffNameLanguage: 'ROMAJI',
      restrictMessagesToFollowing: false,
      disabledListActivity: [{type: 'CURRENT', disabled: false}]
    }))
    expect(response).toBeDefined()
    return response.data.UpdateUser
  })

  test('Save Media List Entries', async () => {
    const variables = {
      mediaId: 143271,
      type: 'ANIME',
      status: 'CURRENT',
      score: 8.5,
      progress: 3,
      customLists: ['test'],
    };
    const response = await handleRateLimit(() => aniLink.anilist.mutation.saveMediaListEntry(variables))
    expect(response).toBeDefined();
    return response.data.SaveMediaListEntry;
  });

  test('Update Media List Entries', async () => {
    const variables = {
      status: 'CURRENT',
      score: 8.5,
      progress: 3,
      ids: [143271, 156822, 170890],
    };
    const response = await handleRateLimit(() => aniLink.anilist.mutation.updateMediaListEntries(variables))
    expect(response).toBeDefined();
    return response.data.UpdateMediaListEntries;
  });

  test('Delete Media List Entry', async () => {
    const entryId = (await handleRateLimit(() => aniLink.anilist.query.mediaList({userId: 6503722, mediaId: 143271}))).data.MediaList.id

    const variables = {
      id: entryId,
    };
    const response = await handleRateLimit(() => aniLink.anilist.mutation.deleteMediaListEntry(variables))
    expect(response).toBeDefined();
    return response.data.DeleteMediaListEntry;
  });

  test('Delete Custom List', async () => {
    const variables = {
      customList: 'test',
      type: 'ANIME',
    };
    const response = await handleRateLimit(() => aniLink.anilist.mutation.deleteCustomList(variables))
    expect(response).toBeDefined();
    return response.data.DeleteCustomList;
  });

  test('Save Text Activity', async () => {
    const variables = {
      id: 725254160,
      text: 'testing'
    };
    const response = await handleRateLimit(() => aniLink.anilist.mutation.saveTextActivity(variables))
    expect(response).toBeDefined();
    return response.data.SaveTextActivity;
  });

  test('Save Message Activity', async () => {
    const variables = {
      recipientId: 542244,
      message: 'testing',
      private: true
    };
    const response = await handleRateLimit(() => aniLink.anilist.mutation.saveMessageActivity(variables))
    expect(response).toBeDefined();
    return response.data.SaveMessageActivity;
  });

  test('Delete Activity', async () => {
    const activityId = (await handleRateLimit(() => aniLink.anilist.query.activity({userId: 542244, messengerId: 6503722, type: 'MESSAGE'}))).data.Activity.id
    const response = await handleRateLimit(() => aniLink.anilist.mutation.deleteActivity({id: activityId}))
    expect(response).toBeDefined();
    return response.data.DeleteActivity;
  });

  test('Toggle Activity Subscription', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.mutation.toggleActivitySubscription({activityId: 725674043, subscribe: true}))
    expect(response).toBeDefined();
    return response.data.ToggleActivitySubscription;
  });

  test('Save & Delete Activity Reply', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.mutation.saveActivityReply({activityId: 723235883, text: 'testing'}))
    const replyId = response.data.SaveActivityReply.id
    const response2 = await handleRateLimit(() => aniLink.anilist.mutation.deleteActivityReply({id: replyId}))
    expect(response && response2).toBeDefined();
    return response.data.SaveActivityReply;
  });

  test('Toggle Like', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.mutation.toggleLike({id: 723235883, type: 'ACTIVITY'}))
    expect(response).toBeDefined();
    return response.data.ToggleLike;
  });

  test('Toggle Like V2', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.mutation.toggleLikeV2({id: 723235883, type: 'ACTIVITY'}))
    expect(response).toBeDefined();
    return response.data.ToggleLikeV2;
  });

  test('Toggle Follow', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.mutation.toggleFollow({userId: 542244}))
    expect(response).toBeDefined();
    return response.data.ToggleFollow;
  });

  test('Toggle Favourite', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.mutation.toggleFavourite({studioId: 561}))
    expect(response).toBeDefined();
    return response.data.ToggleFavourite;
  });

  test('Update Favourite Order', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.mutation.updateFavouriteOrder({studioIds: [561], studioOrder: [561]}))
    expect(response).toBeDefined();
    return response.data.UpdateFavouriteOrder;
  });

  test('Save & Delete Review', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.mutation.saveReview({
      mediaId: 1,
      body: 'a'.repeat(2200), // This will create a string of 'a' with length 2200
      summary: 'b'.repeat(20), // This will create a string of 'b' with length 20
      score: 8,
      private: true
    }))
    const reviewId = response.data.SaveReview.id
    const response2 = await handleRateLimit(() => aniLink.anilist.mutation.deleteReview({id: reviewId}))
    expect(response && response2).toBeDefined();
    return response.data.SaveReview;
  });

  test('Save Recommendation', async () => {
    let response;
    let attempts = 0;
    const maxAttempts = 2; // Maximum number of attempts

    while (!response && attempts < maxAttempts) {
      try {
        response = await handleRateLimit(() => aniLink.anilist.mutation.saveRecommendation({
          mediaId: 1,
          mediaRecommendationId: 495,
          rating: 'NO_RATING'
        }));
      } catch (error) {
        console.log('An error occurred:', error);
        console.log('Retrying...');
      }
      attempts++;
    }

    expect(response).toBeDefined();
    return response.data.SaveRecommendation;
  });
})
