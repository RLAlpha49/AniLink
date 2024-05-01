# AniLink

For full documentation on methods and parameters, please refer to the [AniLink documentation](https://rlalpha49.github.io/AniLink/).

AniLink is a TypeScript library for interacting with the AniList API. It provides methods for querying and mutating data, making it easier to integrate AniList's features into your own applications.

## Installation

To install AniLink, you can use npm or yarn.:

```bash
npm install anilink-api-wrapper
```

or

```bash
yarn add anilink-api-wrapper
```

## Initialization

### AniList

To start using AniLink, you need to import it and initialize it with an optional authentication token. You can get an authentication token by registering your application on the AniList website.

#### Typescript

```typescript
import AniLink from 'anilink-api-wrapper';
```

#### Javascript

```javascript
const AniLink = require('anilink-api-wrapper');
```

#### Initialization

```typescript
const authToken = 'your-auth-token';
const aniLink = new AniLink(authToken);
```

You can also initialize AniLink without an authentication token

```typescript
const aniLink = new AniLink();
```

## AniList API

### Structure

AniLink for AniList is divided into two main sections: `anilist.query` and `anilist.mutation`. The `anilist.query` section contains methods for querying data from the AniList API, while the `anilist.mutation` section contains methods for mutating data.

#### Query Methods

The `anilist.query` section is further divided into main query methods and page query methods. The main query methods return a single piece of data, while the page query methods return pages of data.

List of main query methods in `anilist.query`:

- user
- media
- mediaTrend
- airingSchedule
- character
- staff
- mediaList
- mediaListCollection
- genreCollection
- mediaTagCollection
- viewer
- notification
- studio
- review
- activity
- activityReply
- following
- follower
- thread
- threadComment
- recommendation
- markdown
- aniChartUser
- siteStatistics
- externalLinkSourceCollection

List of page query methods in `anilist.query.page`:

- users
- medias
- characters
- staffs
- studios
- mediaLists
- airingSchedules
- mediaTrends
- notifications
- followers
- following
- activities
- activityReplies
- threads
- threadComments
- reviews
- recommendations
- likes

#### Mutation Methods

List of methods in `anilist.mutation`:

- updateUser
- saveMediaListEntry
- updateMediaListEntries

### Error Handling

AniLink will throw an error if the AniList API returns an error. You can catch these errors using a try-catch block.

```typescript
try {
  const user = await aniLink.anilist.query.user({id: 542244});
  console.log(user);
} catch (error) {
  console.error(error);
}
```

This includes status codes and error messages returned by the AniList API. Here is an example rate limit handler to catch the errors thrown by AniLink:

##### Typescript

```typescript
async function handleRateLimit(apiCall: () => Promise<any>, retryAfter = 60) {
  try {
    let response;
    try {
      response = await apiCall();
    } catch (error) {
      throw error;
    }
    console.log(response.data);
    return response;
  } catch (error: any) {
    if (error.response && error.response.status === 429) {
      console.log('Rate limit exceeded, waiting for 1 minute before retrying...');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      console.log('Retrying...');
      return handleRateLimit(apiCall, retryAfter);
    } else {
      if (error.response && error.response.data) {
        throw error.response.data;
      } else {
        throw error.response || error;
      }
    }
  }
}
```

##### Javascript

```javascript
async function handleRateLimit(apiCall, retryAfter = 60) {
    // Same as above
}
```

The possible error codes returned by the AniList API are:
- 400: Bad Request (e.g. missing variables, invalid variables, or invalid query)
- 401: Unauthorized (e.g. invalid authentication token)
- 404: Not Found (e.g. user not found)
- 429: Too Many Requests (e.g. rate limit exceeded)
- 500: Internal Server Error (e.g. AniList server error)

#### Missing or Invalid Variables

AniLink will also throw an error if any variables are missing or invalid. For example, if you try to query a user providing a string instead of a number for ID, AniLink will throw an error. Most variables are optional however there a few that are required.
```typescript
try {
  const user = await aniLink.anilist.query.user({id: '542244'});
  console.log(user);
} catch (error) {
  console.error(error);
}
```

Example Error Thrown:

```typescript
  Invalid id: 542244. Expected type: number
```

### Examples

Here are examples of how to use AniLink to interact with the AniList API:

#### Querying user data

```typescript
// Querying user data
aniLink.anilist.query.user({id: 542244, isHTML: true});

// Querying media data
aniLink.anilist.query.media({id: 1, type: 'ANIME'});

// Querying media trend data
aniLink.anilist.query.mediaTrend({mediaId: 1, type: 'ANIME'});

// Querying airing schedule data
aniLink.anilist.query.airingSchedule({mediaId: 130590});

// Querying character data
aniLink.anilist.query.character({
  id: 1,
  asHtml: true,
  mediaSort: ['POPULARITY_DESC'],
  mediaType: 'ANIME',
  mediaOnList: true,
  mediaPage: 1,
  mediaPerPage: 10
});

// Querying staff data
aniLink.anilist.query.staff({
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
});

// Querying media list data
aniLink.anilist.query.mediaList({userId: 542244});

// Querying media list collection data
aniLink.anilist.query.mediaListCollection({
  userId: 542244,
  type: 'ANIME',
  status: 'COMPLETED',
  chunk: 1,
  perChunk: 10000
});

// Querying genre collection data
aniLink.anilist.query.genreCollection();

// Querying media tag collection data
aniLink.anilist.query.mediaTagCollection();

// Querying viewer data
aniLink.anilist.query.viewer({isHTML: true});

// Querying notification data
aniLink.anilist.query.notification({asHtml: true});

// Querying studio data
aniLink.anilist.query.studio({id: 561, asHtml: true});

// Querying review data
aniLink.anilist.query.review({id: 8008, asHtml: true});

// Querying activity data
aniLink.anilist.query.activity({id: 723235883, asHtml: true});

// Querying activity reply data
aniLink.anilist.query.activityReply({id: 12191046, asHtml: true});

// Querying following data
aniLink.anilist.query.following({userId: 542244, asHtml: true});

// Querying follower data
aniLink.anilist.query.follower({userId: 542244, asHtml: true});

// Querying thread data
aniLink.anilist.query.thread({id: 71881, asHtml: true});

// Querying thread comment data
aniLink.anilist.query.threadComment({id: 2555166, asHtml: true});

// Querying recommendation data
aniLink.anilist.query.recommendation({mediaId: 156822, asHtml: true});

// Querying markdown data
aniLink.anilist.query.markdown({markdown: 'Hello'});

// Querying AniChartUser data
aniLink.anilist.query.aniChartUser();

// Querying site statistics data
aniLink.anilist.query.siteStatistics();

// Querying external link source collection data
aniLink.anilist.query.externalLinkSourceCollection();

// Querying users page data
aniLink.anilist.query.page.users({id: 542244, isHTML: true});

// Querying media page data
aniLink.anilist.query.page.medias({id: 1, type: 'ANIME'});

// Querying character page data
aniLink.anilist.query.page.characters({id: 1, asHtml: true});

// Querying staff page data
aniLink.anilist.query.page.staffs({id: 132186, asHtml: true});

// Querying studio page data
aniLink.anilist.query.page.studios({id: 561, asHtml: true});

// Querying media list page data
aniLink.anilist.query.page.mediaLists({userId: 542244});

// Querying airing schedule page data
aniLink.anilist.query.page.airingSchedules({mediaId: 130590});

// Querying media trend page data
aniLink.anilist.query.page.mediaTrends({mediaId: 1, type: 'ANIME'});

// Querying notification page data
aniLink.anilist.query.page.notifications({asHtml: true});

// Querying follower page data
aniLink.anilist.query.page.followers({userId: 542244, asHtml: true});

// Querying following page data
aniLink.anilist.query.page.following({userId: 542244, asHtml: true});

// Querying activity page data
aniLink.anilist.query.page.activities({id: 723235883, asHtml: true});

// Querying activity reply page data
aniLink.anilist.query.page.activityReplies({id: 12191046, asHtml: true
});

// Querying thread page data
aniLink.anilist.query.page.threads({id: 71881, asHtml: true});

// Querying thread comment page data
aniLink.anilist.query.page.threadComments({threadId: 71881, asHtml: true
});

// Querying review page data
aniLink.anilist.query.page.reviews({id: 8008, asHtml: true});

// Querying recommendation page data
aniLink.anilist.query.page.recommendations({mediaId: 156822, asHtml: true
});

// Querying likes page data
aniLink.anilist.query.page.likes({likeableId: 723422275, type: 'ACTIVITY', asHtml: true
});
```

#### Mutating user data

```typescript
// Updating a user
aniLink.anilist.mutation.updateUser({
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
});

// Saving media list entries
aniLink.anilist.mutation.saveMediaListEntry({
  mediaId: 1,
  status: 'CURRENT',
  score: 8.5,
  progress: 3,
});

// Updating media list entries
aniLink.anilist.mutation.updateMediaListEntries({
  status: 'CURRENT',
  score: 8.5,
  progress: 3,
  ids: [143271, 156822, 170890],
});
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.