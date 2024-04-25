const AniLink = require('../dist/AniLink.js');

const aniLink = new AniLink();

describe('AniLink', () => {
  test('user query should return a response', async () => {
    const response = await aniLink.anilist.query.user.user({ id: 1, isHTML: false });
    expect(response).toBeDefined();
  });

  test('user query should handle errors', async () => {
    try {
      await aniLink.anilist.query.user.user({ id: 'invalid', isHTML: false });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});