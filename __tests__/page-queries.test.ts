import { createTestClient, getLastRequest, mockSendRequest } from './helpers/mockRequestHandler'
import { describe, expect, test } from 'vitest'

const pageCases: Array<[string, object, string, string]> = [
  ['users', { isHTML: true }, 'users', 'Page'],
  ['medias', { id: 1, type: 'ANIME' }, 'medias', 'Page'],
  ['characters', { id: 1, asHtml: true }, 'characters', 'Page'],
  ['staffs', { id: 132186, asHtml: true }, 'staffs', 'Page'],
  ['studios', { asHtml: true }, 'studios', 'Page'],
  ['media lists', { userId: 542244 }, 'mediaLists', 'Page'],
  ['airing schedules', { type: 'ANIME' }, 'airingSchedules', 'Page'],
  ['media trends', { type: 'ANIME' }, 'mediaTrends', 'Page'],
  ['notifications', { asHtml: true }, 'notifications', 'Page'],
  ['followers', { userId: 542244, asHtml: true }, 'followers', 'Page'],
  ['following', { userId: 542244, asHtml: true }, 'following', 'Page'],
  ['activities', { id: 723235883, asHtml: true }, 'activities', 'Page'],
  ['activity replies', { id: 12191046, asHtml: true }, 'activityReplies', 'Page'],
  ['threads', { id: 71881, asHtml: true }, 'threads', 'Page'],
  ['thread comments', { threadId: 71881, asHtml: true }, 'threadComments', 'Page'],
  ['reviews', { id: 8008, asHtml: true }, 'reviews', 'Page'],
  ['recommendations', { mediaId: 156822, asHtml: true }, 'recommendations', 'Page'],
  ['likes', { likeableId: 723422275, type: 'ACTIVITY', asHtml: true }, 'likes', 'Page']
]

describe('AniList page queries', () => {
  test.each(pageCases)('%s is handled without network access', async (_name, variables, method, operation) => {
    const client = createTestClient('page-query-token')
    const call = (client.anilist.query.page as any)[method]

    await call(variables)

    expect(mockSendRequest).toHaveBeenCalledTimes(1)
    expect(getLastRequest()).toEqual(expect.objectContaining({
      url: 'https://graphql.anilist.co',
      method: 'POST',
      token: 'page-query-token',
      data: expect.objectContaining({
        query: expect.stringContaining(operation),
        variables
      })
    }))
  })
})
