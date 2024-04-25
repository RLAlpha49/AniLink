import AniLink from '../dist/AniLink.js';

describe('Anilist API', () => {
  let aniLink: AniLink;

  beforeAll(() => {
    aniLink = new AniLink();
  });

  test('user query', async () => {
    const response = await aniLink.anilist.query.user.user({ id: 1, isHTML: false });
    expect(response).toBeDefined();
  });
});