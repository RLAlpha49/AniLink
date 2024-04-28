require('dotenv').config()
import AniLink from '../dist/AniLink.js'
// import AniLink from '../src/AniLink'

async function handleRateLimit(apiCall: () => Promise<any>, retryAfter = 60) {
  try {
    return await apiCall();
  } catch (error: any) {
    if (error.response && error.response.status === 429) {
      console.log('Rate limit exceeded, waiting for 1 minute before retrying...');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      console.log('Retrying...');
      return handleRateLimit(apiCall, retryAfter);
    } else {
      throw error;
    }
  }
}

describe('Anilist API Query', () => {
  let aniLink: AniLink

  beforeAll(() => {
    const token = process.env.ANILIST_TOKEN
    aniLink = new AniLink(token)
  })

  test('user query', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.user({ id: 542244, isHTML: true }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('media query', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.media({ id: 1, type: 'ANIME' }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('media trend query', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.mediaTrend({ mediaId: 1, type: 'ANIME' }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('airing schedule query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.airingSchedule({ mediaId: 130590 })) // id needs to be an airing anime
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('character query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.character({ id: 1, asHtml: true, mediaSort: ['POPULARITY_DESC'], mediaType: 'ANIME', mediaOnList: true, mediaPage: 1, mediaPerPage: 10 }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('staff query should return a response', async () => {
    try {
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
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('media list query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.mediaList({ userId: 542244 }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('media list collection query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.mediaListCollection({
        userId: 542244,
        type: 'ANIME',
        status: 'COMPLETED',
        chunk: 1,
        perChunk: 10000
      }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('genre collection query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.genreCollection())
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('media tag collection query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.mediaTagCollection())
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('viewer query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.viewer({ isHTML: true }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('notification query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.notification({ asHtml: true }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('studio query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.studio({ id: 561, asHtml: true }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('review query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.review({ id: 8008, asHtml: true }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('activity query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.activity({ id: 723235883, asHtml: true }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('activity reply query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.activityReply({ id: 12191046, asHtml: true }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('following query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.following({ userId: 542244, asHtml: true }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })

  test('follower query should return a response', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.query.follower({ userId: 542244, asHtml: true }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })
})

describe('Anilist API Mutation', () => {
  let aniLink: AniLink

  beforeAll(() => {
    const token = process.env.ANILIST_TOKEN
    aniLink = new AniLink(token)
  })

  test('update user', async () => {
    try {
      const response = await handleRateLimit(() => aniLink.anilist.mutation.updateUser({
        about: 'New about text',
        titleLanguage: 'ENGLISH',
        displayAdultContent: true,
        airingNotifications: true,
        scoreFormat: 'POINT_10',
        rowOrder: 'title',
        profileColor: 'blue',
        donatorBadge: 'Supporter',
        notificationOptions: [{ type: 'AIRING', enabled: true }],
        timezone: '-06:00',
        activityMergeTime: 30,
        animeListOptions: { sectionOrder: ['title'], customLists: [], advancedScoring: [], advancedScoringEnabled: false },
        mangaListOptions: { sectionOrder: ['title'], customLists: [], advancedScoring: [], advancedScoringEnabled: false },
        staffNameLanguage: 'ROMAJI',
        restrictMessagesToFollowing: false,
        disabledListActivity: [{ type: 'CURRENT', disabled: false }]
      }))
      console.log(response)
      expect(response).toBeDefined()
    } catch (error: any) {
      if (error.response.data) {
        throw error.response.data
      } else {
        throw error.response
      }
    }
  })
})
