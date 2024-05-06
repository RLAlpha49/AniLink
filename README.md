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
- deleteMediaListEntries
- deleteCustomLists
- saveTextActivity
- saveMessageActivity
- deleteActivity
- toggleActivityPin
- toggleActivitySubscription
- saveActivityReply
- deleteActivityReply
- toggleLike
- toggleLikeV2
- toggleFollow
- toggleFavourite
- updateFavouriteOrder
- saveReview
- deleteReview
- saveRecommendation
- saveThread
- deleteThread
- toggleThreadSubscription
- saveThreadComment
- deleteThreadComment
- updateAniChartSettings
- updateAniChartHighlights

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

See the [ANILIST_API_EXAMPLES](https://github.com/RLAlpha49/AniLink/blob/master/Examples/ANILIST_API_EXAMPLES.md) for examples of how to use AniLink to interact with the AniList API.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/RLAlpha49/AniLink/blob/master/LICENSE) file for details.