import AniLink from '../dist/AniLink.js'
// import AniLink from '../src/AniLink'

describe('Anilist API Query', () => {
  let aniLink: AniLink

  beforeAll(() => {
    aniLink = new AniLink()
  })

  test('user query', async () => {
    const response = await aniLink.anilist.query.user({ id: 1, isHTML: false })
    expect(response).toBeDefined()
  })

  test('user query should handle errors', async () => {
    try {
      await aniLink.anilist.query.user({ id: 'invalid', isHTML: false })
    } catch (error: any) {
      expect(error).toBeDefined()
    }
  })

  test('media query', async () => {
    const response = await aniLink.anilist.query.media({ id: 1, type: 'ANIME' })
    expect(response).toBeDefined()
  })

  test('media query should handle errors', async () => {
    try {
      await aniLink.anilist.query.media({ id: 'invalid', type: 'ANIME' })
    } catch (error: any) {
      expect(error).toBeDefined()
    }
  })

  test('media trend query', async () => {
    const response = await aniLink.anilist.query.mediaTrend({ mediaId: 1, type: 'ANIME' })
    expect(response).toBeDefined()
  })

  test('media trend query should handle errors', async () => {
    try {
      await aniLink.anilist.query.mediaTrend({ mediaId: 'invalid', type: 'ANIME' })
    } catch (error: any) {
      expect(error).toBeDefined()
    }
  })

  test('airing schedule query should return a response', async () => {
    const response = await aniLink.anilist.query.airingSchedule({ mediaId: 130590 }) // id needs to be an airing anime
    expect(response).toBeDefined()
  })

  test('airing schedule query should handle errors', async () => {
    try {
      await aniLink.anilist.query.airingSchedule({ mediaId: 'invalid' })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test('character query should return a response', async () => {
    const response = await aniLink.anilist.query.character({ id: 1, asHtml: true, mediaSort: ['POPULARITY_DESC'], mediaType: 'ANIME', mediaOnList: true, mediaPage: 1, mediaPerPage: 10 })
    expect(response).toBeDefined()
  })

  test('character query should handle errors', async () => {
    try {
      await aniLink.anilist.query.character({ id: 'invalid', asHtml: true, mediaSort: ['POPULARITY_DESC'], mediaOnList: true, mediaPage: 1, mediaPerPage: 10 })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})

describe('Anilist API Mutation', () => {
  let aniLink: AniLink

  beforeAll(() => {
    aniLink = new AniLink()
  })

  test('update user', async () => {
    const response = await aniLink.anilist.mutation.updateUser({
      about: 'New about text',
      titleLanguage: 'ENGLISH',
      displayAdultContent: true,
      airingNotifications: true,
      scoreFormat: 'POINT_10',
      rowOrder: 'title',
      profileColor: 'blue',
      donatorBadge: 'Supporter',
      notificationOptions: [{ type: 'ANIME_AIRING', enabled: true }],
      timezone: 'GMT',
      activityMergeTime: 30,
      animeListOptions: { scoreFormat: 'POINT_10', rowOrder: 'title', animeList: {}, mangaList: {} },
      mangaListOptions: { scoreFormat: 'POINT_10', rowOrder: 'title', animeList: {}, mangaList: {} },
      staffNameLanguage: 'ENGLISH',
      restrictMessagesToFollowing: false,
      disabledListActivity: ['ANIME_LIST']
    })
    expect(response).toBeDefined()
  })
})
