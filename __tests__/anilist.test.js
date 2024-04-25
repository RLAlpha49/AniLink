/* global describe, test, expect */

const AniLink = require('../dist/AniLink.js')

describe('Anilist API Query', () => {
  const aniLink = new AniLink()

  test('user query should return a response', async () => {
    const response = await aniLink.anilist.query.user({ id: 1, isHTML: false })
    expect(response).toBeDefined()
  })

  test('user query should handle errors', async () => {
    try {
      await aniLink.anilist.query.user({ id: 'invalid', isHTML: false })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test('media query should return a response', async () => {
    const response = await aniLink.anilist.query.media({ id: 1, type: 'ANIME' })
    expect(response).toBeDefined()
  })

  test('media query should handle errors', async () => {
    try {
      await aniLink.anilist.query.media({ id: 'invalid', type: 'ANIME' })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test('media trend query should return a response', async () => {
    const response = await aniLink.anilist.query.mediaTrend({ mediaId: 1, type: 'ANIME' })
    expect(response).toBeDefined()
  })

  test('media trend query should handle errors', async () => {
    try {
      await aniLink.anilist.query.mediaTrend({ mediaId: 'invalid', type: 'ANIME' })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })
})

describe('Anilist API Mutation', () => {
  const aniLink = new AniLink()

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
