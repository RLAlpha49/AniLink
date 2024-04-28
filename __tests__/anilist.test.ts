require('dotenv').config()
import AniLink from '../dist/AniLink.js'
// import AniLink from '../src/AniLink'

async function handleRateLimit(apiCall: () => Promise<any>, retryAfter = 60) {
  try {
    const response = await apiCall();
    console.log(response.data);
    return response;
  } catch (error: any) {
    if (error.response && error.response.status === 429) {
      console.log('Rate limit exceeded, waiting for 1 minute before retrying...');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      console.log('Retrying...');
      return handleRateLimit(apiCall, retryAfter);
    } else {
      if (error.response.data) {
        throw error.response.data;
      } else {
        throw error.response;
      }
    }
  }
}

describe('Anilist API Query', () => {
  let aniLink: AniLink

  beforeEach(() => {
    const token = process.env.ANILIST_TOKEN;
    aniLink = new AniLink(token);
  });

  test('User Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.user({id: 542244, isHTML: true}))
    expect(response).toBeDefined()
  })

  test('Media Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.media({id: 1, type: 'ANIME'}))
    expect(response).toBeDefined()
  })

  test('Media Trend Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.mediaTrend({mediaId: 1, type: 'ANIME'}))
    expect(response).toBeDefined()
  })

  test('Airing Schedule Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.airingSchedule({mediaId: 130590})) // id needs to be an airing anime
    expect(response).toBeDefined()

  })

  test('Character Query', async () => {
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
  })

  test('Staff Query', async () => {
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
  })

  test('Media List Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.mediaList({userId: 542244}))
    expect(response).toBeDefined()
  })

  test('Media List Collection Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.mediaListCollection({
      userId: 542244,
      type: 'ANIME',
      status: 'COMPLETED',
      chunk: 1,
      perChunk: 10000
    }))
    expect(response).toBeDefined()
  })

  test('Genre Collection Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.genreCollection())
    expect(response).toBeDefined()
  })

  test('Media Tag Collection Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.mediaTagCollection())
    expect(response).toBeDefined()
  })

  test('Viewer Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.viewer({isHTML: true}))
    expect(response).toBeDefined()
  })

  test('Notification Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.notification({asHtml: true}))
    expect(response).toBeDefined()
  })

  test('Studio Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.studio({id: 561, asHtml: true}))
    expect(response).toBeDefined()
  })

  test('Review Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.review({id: 8008, asHtml: true}))
    expect(response).toBeDefined()
  })

  test('Activity Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.activity({id: 723235883, asHtml: true}))
    expect(response).toBeDefined()
  })

  test('Activity Reply Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.activityReply({id: 12191046, asHtml: true}))
    expect(response).toBeDefined()
  })

  test('Following Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.following({userId: 542244, asHtml: true}))
    expect(response).toBeDefined()
  })

  test('Follower Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.follower({userId: 542244, asHtml: true}))
    expect(response).toBeDefined()
  })

  test('Thread Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.thread({id: 71881, asHtml: true}))
    expect(response).toBeDefined()
  })

  test('Thread Comment Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.threadComment({id: 2555166, asHtml: true}))
    expect(response).toBeDefined()
  })

  test('Reccomendation Query', async () => {
    const response = await handleRateLimit(() => aniLink.anilist.query.recommendation({mediaId: 156822, asHtml: true}))
    expect(response).toBeDefined()
  })
})

describe('Anilist API Mutation', () => {
  let aniLink: AniLink

  beforeEach(() => {
    const token = process.env.ANILIST_TOKEN
    aniLink = new AniLink(token)
  })

  test('Update User', async () => {
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
  })
})
