import { AniLink } from '../src/AniLink';

describe('Anilist API', () => {
  let aniLink: AniLink;

  beforeAll(() => {
    aniLink = new AniLink();
  });

  test('user query', async () => {
    const response = await aniLink.anilist.query.user.user({ id: 1, isHTML: false });
    console.log(response);
    expect(response).toBeDefined();
  });
});