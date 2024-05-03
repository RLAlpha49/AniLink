## Examples

Here are examples of how to use AniLink to interact with the AniList API:

### Querying user data

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

### Mutating user data

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
  animeListOptions: {sectionOrder: ['title'], customLists: ['test'], advancedScoring: [], advancedScoringEnabled: false},
  mangaListOptions: {sectionOrder: ['title'], customLists: ['test'], advancedScoring: [], advancedScoringEnabled: false},
  staffNameLanguage: 'ROMAJI',
  restrictMessagesToFollowing: false,
  disabledListActivity: [{type: 'CURRENT', disabled: false}]
});

// Saving media list entries
aniLink.anilist.mutation.saveMediaListEntry({
  mediaId: 143271,
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

// Deleting media list entry
const entryId = (
  await handleRateLimit(() => aniLink.anilist.query.mediaList(
    {
      userId: 6503722,
      mediaId: 143271
    }
   )
  )
).data.MediaList.id;
aniLink.anilist.mutation.deleteMediaListEntry({id: entryId});

// Deleting custom list
aniLink.anilist.mutation.deleteCustomLists({customList: 'test'});

// Create text activity
aniLink.anilist.mutation.saveTextActivity({text: 'test'})

// Update text activity
aniLink.anilist.mutation.saveTextActivity({id: 725254160, text: 'Updated Text'})

// Create message activity
aniLink.anilist.mutation.saveMessageActivity({recipientId: 542244, message: 'test'})

// Update message activity
aniLink.anilist.mutation.saveMessageActivity({id: 725254160, message: 'Updated Message'})

// Update list activity
// Mod only
aniLink.anilist.mutation.saveListActivity({id: 725254160})

// Delete Activity
const activityId = (
  await handleRateLimit(() => aniLink.anilist.query.activity(
    {
      userId: 542244,
      messengerId: 6503722,
      type: 'MESSAGE'
    }
   )
  )
).data.Activity.id
aniLink.anilist.mutation.deleteActivity({id: activityId});

// Toggle Activity Pin
aniLink.anilist.mutation.toggleActivityPin({id: 1, pinned: true});

// Toggle Activity Subscription
aniLink.anilist.mutation.toggleActivitySubscription({activityId: 1, subscribe: true});
```