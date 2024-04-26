require('dotenv').config()
import AniLink from '../dist/AniLink.js'
// import AniLink from '../src/AniLink'

describe('Anilist API Query', () => {
  let aniLink: AniLink

  beforeAll(() => {
    const token = process.env.ANILIST_TOKEN
    aniLink = new AniLink(token)
  })

  test('user query', async () => {
    try {
      const response = await aniLink.anilist.query.user({ id: 542244, isHTML: true })
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

  test('user query should handle errors', async () => {
    try {
      await aniLink.anilist.query.user({ id: 'invalid', isHTML: false })
    } catch (error: any) {
      expect(error).toBeDefined()
    }
  })

  test('media query', async () => {
    try {
      const response = await aniLink.anilist.query.media({ id: 1, type: 'ANIME' })
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

  test('media query should handle errors', async () => {
    try {
      await aniLink.anilist.query.media({ id: 'invalid', type: 'ANIME' })
    } catch (error: any) {
      expect(error).toBeDefined()
    }
  })

  test('media trend query', async () => {
    try {
      const response = await aniLink.anilist.query.mediaTrend({ mediaId: 1, type: 'ANIME' })
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

  test('media trend query should handle errors', async () => {
    try {
      await aniLink.anilist.query.mediaTrend({ mediaId: 'invalid', type: 'ANIME' })
    } catch (error: any) {
      expect(error).toBeDefined()
    }
  })

  test('airing schedule query should return a response', async () => {
    try {
      const response = await aniLink.anilist.query.airingSchedule({ mediaId: 130590 }) // id needs to be an airing anime
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

  test('airing schedule query should handle errors', async () => {
    try {
      await aniLink.anilist.query.airingSchedule({ mediaId: 'invalid' })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test('character query should return a response', async () => {
    try {
      const response = await aniLink.anilist.query.character({ id: 1, asHtml: true, mediaSort: ['POPULARITY_DESC'], mediaType: 'ANIME', mediaOnList: true, mediaPage: 1, mediaPerPage: 10 })
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

  test('character query should handle errors', async () => {
    try {
      await aniLink.anilist.query.character({ id: 'invalid', asHtml: true, mediaSort: ['POPULARITY_DESC'], mediaOnList: true, mediaPage: 1, mediaPerPage: 10 })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test('staff query should return a response', async () => {
    try {
      const response = await aniLink.anilist.query.staff({
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
      })
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

  test('staff query should handle errors', async () => {
    try {
      await aniLink.anilist.query.staff({
        id: 'invalid'
      })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

    test('media list query should return a response', async () => {
      try {
        const response = await aniLink.anilist.query.mediaList({ userId: 542244 })
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

    test('media list query should handle errors', async () => {
        try {
            await aniLink.anilist.query.mediaList({ userId: 'invalid' })
        } catch (error) {
            expect(error).toBeDefined()
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
      const response = await aniLink.anilist.mutation.updateUser({
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
      })
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
