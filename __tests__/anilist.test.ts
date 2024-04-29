import {ExternalLinkSourceCollectionQuery} from "../src/apis/anilist/query/ExternalLinkSourceCollection";

require('dotenv').config()
import AniLink from '../dist/AniLink.js'
// import AniLink from '../src/AniLink'

import {BasicUser} from "../src/apis/anilist/interfaces/BasicUser"
import {RecommendationResponse} from "../src/apis/anilist/interfaces/responses/Recommendation"
import {ThreadCommentResponse} from "../src/apis/anilist/interfaces/responses/ThreadComment"
import {ThreadResponse} from "../src/apis/anilist/interfaces/responses/Thread"
import {UserResponse} from "../src/apis/anilist/interfaces/responses/User"
import {Activity} from "../src/apis/anilist/interfaces/Activity"
import {ActivityReply} from "../src/apis/anilist/interfaces/ActivityReply"
import {ReviewResponse} from "../src/apis/anilist/interfaces/responses/Review"
import {StudioResponse} from "../src/apis/anilist/interfaces/responses/Studio"
import {NotificationResponse} from "../src/apis/anilist/interfaces/responses/Notification"
import {MediaTagCollectionResponse} from "../src/apis/anilist/interfaces/responses/MediaTagCollection"
import {MediaListResponse} from "../src/apis/anilist/interfaces/responses/MediaList"
import {StaffResponse} from "../src/apis/anilist/interfaces/responses/Staff"
import {CharacterResponse} from "../src/apis/anilist/interfaces/responses/Character"
import {AiringScheduleResponse} from "../src/apis/anilist/interfaces/responses/AiringSchedule"
import {MediaListCollectionResponse} from "../src/apis/anilist/interfaces/responses/MediaListCollectionResponse"
import {MediaTrendResponse} from "../src/apis/anilist/interfaces/responses/MediaTrend"
import {MediaResponse} from "../src/apis/anilist/interfaces/responses/Media"
import {AniChartUserResponse} from "../src/apis/anilist/interfaces/responses/AniChartUser"
import {SiteStatisticsResponse} from "../src/apis/anilist/interfaces/responses/SiteStatistics";

async function handleRateLimit(apiCall: () => Promise<any>, retryAfter = 60) {
  try {
    const response = await apiCall()
    console.log(response.data)
    return response
  } catch (error: any) {
    if (error.response && error.response.status === 429) {
      console.log('Rate limit exceeded, waiting for 1 minute before retrying...')
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
      console.log('Retrying...')
      return handleRateLimit(apiCall, retryAfter)
    } else {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  }
}

describe('Anilist API Query', () => {
  let aniLink: AniLink

  beforeEach(() => {
    const token = process.env.ANILIST_TOKEN
    aniLink = new AniLink(token)
  })

  test('User Query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.user({id: 542244, isHTML: true}))
    expect(response).toBeDefined()
    return response.data.User
  })

  test('Media Query', async (): Promise<MediaResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.media({id: 1, type: 'ANIME'}))
    expect(response).toBeDefined()
    return response.data.Media
  })

  test('Media Trend Query', async (): Promise<MediaTrendResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.mediaTrend({mediaId: 1, type: 'ANIME'}))
    expect(response).toBeDefined()
    return response.data.MediaTrend
  })

  test('Airing Schedule Query', async (): Promise<AiringScheduleResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.airingSchedule({mediaId: 130590})) // id needs to be an airing anime
    expect(response).toBeDefined()
    return response.data.AiringSchedule

  })

  test('Character Query', async (): Promise<CharacterResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.character({
      id: 1,
      asHtml: true,
      mediaSort: ['POPULARITY_DESC'],
      mediaType: 'ANIME',
      mediaOnList: true,
      mediaPage: 1,
      mediaPerPage: 10
    }))
    expect(response).toBeDefined()
    return response.data.Character
  })

  test('Staff Query', async (): Promise<StaffResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.staff({
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

  test('Media List Query', async (): Promise<MediaListResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.mediaList({userId: 542244}))
    expect(response).toBeDefined()
    return response.data.MediaList
  })

  test('Media List Collection Query', async (): Promise<MediaListCollectionResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.mediaListCollection({
      userId: 542244,
      type: 'ANIME',
      status: 'COMPLETED',
      chunk: 1,
      perChunk: 10000
    }))
    expect(response).toBeDefined()
    return response.data.MediaListCollection
  })

  test('Genre Collection Query', async (): Promise<String> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.genreCollection())
    expect(response).toBeDefined()
    return response.data.GenreCollection
  })

  test('Media Tag Collection Query', async (): Promise<MediaTagCollectionResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.mediaTagCollection())
    expect(response).toBeDefined()
    return response.data.MediaTagCollection
  })

  test('Viewer Query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.viewer({isHTML: true}))
    expect(response).toBeDefined()
    return response.data.Viewer
  })

  test('Notification Query', async (): Promise<NotificationResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.notification({asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Notification
  })

  test('Studio Query', async (): Promise<StudioResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.studio({id: 561, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Studio
  })

  test('Review Query', async (): Promise<ReviewResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.review({id: 8008, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Review
  })

  test('Activity Query', async (): Promise<Activity> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.activity({id: 723235883, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Activity
  })

  test('Activity Reply Query', async (): Promise<ActivityReply> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.activityReply({id: 12191046, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.ActivityReply
  })

  test('Following Query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.following({userId: 542244, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Following
  })

  test('Follower Query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.follower({userId: 542244, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Follower
  })

  test('Thread Query', async (): Promise<ThreadResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.thread({id: 71881, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Thread
  })

  test('Thread Comment Query', async (): Promise<ThreadCommentResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.threadComment({id: 2555166, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.ThreadComment
  })

  test('Reccomendation Query', async (): Promise<RecommendationResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.recommendation({mediaId: 156822, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Recommendation
  })

  test('Markdown Query', async (): Promise<String> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.markdown({markdown: 'Hello'}))
    expect(response).toBeDefined()
    return response.data.Markdown.html
  })

  test('AniChartUser Query', async (): Promise<AniChartUserResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.aniChartUser())
    expect(response).toBeDefined()
    return response.data.AniChartUser
  })

  test('Site Statistics Query', async (): Promise<SiteStatisticsResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.siteStatistics())
    expect(response).toBeDefined()
    return response.data.SiteStatistics
  })

  test('External Link Source Collection Query', async (): Promise<ExternalLinkSourceCollectionQuery> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.externalLinkSourceCollection())
    expect(response).toBeDefined()
    return response.data.ExternalLinkSourceCollection
  })


  test('Users Page Query', async (): Promise<BasicUser> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.users({id: 542244, isHTML: true}))
    expect(response).toBeDefined()
    return response.data.Page.users
  })

  test('Media Page Query', async (): Promise<MediaResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.medias({id: 1, type: 'ANIME'}))
    expect(response).toBeDefined()
    return response.data.Page.media
  })

  test('Character Page Query', async (): Promise<CharacterResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.characters({id: 1, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.characters
  })

  test('Staff Page Query', async (): Promise<StaffResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.staffs({id: 132186, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.staff
  })

  test('Studio Page Query', async (): Promise<StudioResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.studios({id: 561, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.studios
  })

  test('Media List Page Query', async (): Promise<MediaListResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.mediaLists({userId: 542244}))
    expect(response).toBeDefined()
    return response.data.Page.mediaList
  })

  test('Airing Schedule Page Query', async (): Promise<AiringScheduleResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.airingSchedules({mediaId: 130590}))
    expect(response).toBeDefined()
    return response.data.Page.airingSchedules
  })

  test('Media Trend Page Query', async (): Promise<MediaTrendResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.mediaTrends({mediaId: 1, type: 'ANIME'}))
    expect(response).toBeDefined()
    return response.data.Page.mediaTrends
  })

  test('Notification Page Query', async (): Promise<NotificationResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.notifications({asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.notifications
  })

  test('Follower Page Query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.followers({userId: 542244, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.followers
  })

  test('Following Page Query', async (): Promise<UserResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.following({userId: 542244, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.following
  })

  test('Activity Page Query', async (): Promise<Activity> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.activities({id: 723235883, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.activities
  })

  test('Activity Reply Page Query', async (): Promise<ActivityReply> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.activityReplies({id: 12191046, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.activityReplies
  })

  test('Thread Page Query', async (): Promise<ThreadResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.threads({id: 71881, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.threads
  })

  test('Thread Comment Page Query', async (): Promise<ThreadCommentResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.threadComments({threadId: 71881, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.threadComments
  })

  test('Review Page Query', async (): Promise<ReviewResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.reviews({id: 8008, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.reviews
  })

  test('Recommendation Page Query', async (): Promise<RecommendationResponse> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.recommendations({mediaId: 156822, asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.recommendations
  })

  test('Likes Page Query', async (): Promise<BasicUser> => {
    const response = await handleRateLimit(() => aniLink.anilist.query.page.likes({likeableId: 723422275, type: 'ACTIVITY', asHtml: true}))
    expect(response).toBeDefined()
    return response.data.Page.likes
  })
})

describe('Anilist API Mutation', () => {
  let aniLink: AniLink

  beforeEach(() => {
    const token = process.env.ANILIST_TOKEN
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
      animeListOptions: {sectionOrder: ['title'], customLists: [], advancedScoring: [], advancedScoringEnabled: false},
      mangaListOptions: {sectionOrder: ['title'], customLists: [], advancedScoring: [], advancedScoringEnabled: false},
      staffNameLanguage: 'ROMAJI',
      restrictMessagesToFollowing: false,
      disabledListActivity: [{type: 'CURRENT', disabled: false}]
    }))
    expect(response).toBeDefined()
    return response.data.UpdateUser
  })
})
