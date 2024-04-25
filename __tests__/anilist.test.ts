// @ts-ignore
import AniLink from '../dist/AniLink.js';

describe('Anilist API', () => {
  let aniLink: AniLink;

  beforeAll(() => {
    aniLink = new AniLink();
  });

  test('user query', async () => {
    const response = await aniLink.anilist.query.user({ id: 1, isHTML: false });
    expect(response).toBeDefined();
  });

  test('update user', async () => {
    const response = await aniLink.anilist.mutation.updateUser.updateUser({
      about: "New about text",
      titleLanguage: "ENGLISH",
      displayAdultContent: true,
      airingNotifications: true,
      scoreFormat: "POINT_10",
      rowOrder: "title",
      profileColor: "blue",
      donatorBadge: "Supporter",
      notificationOptions: [{ type: "ANIME_AIRING", enabled: true }],
      timezone: "GMT",
      activityMergeTime: 30,
      animeListOptions: { scoreFormat: "POINT_10", rowOrder: "title", animeList: {}, mangaList: {} },
      mangaListOptions: { scoreFormat: "POINT_10", rowOrder: "title", animeList: {}, mangaList: {} },
      staffNameLanguage: "ENGLISH",
      restrictMessagesToFollowing: false,
      disabledListActivity: ["ANIME_LIST"]
    });
    expect(response).toBeDefined();
  });
});