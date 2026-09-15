/**
 * Curated JSDoc prose for the generated AniList facade group files.
 *
 * `scripts/generate-facade-groups.ts` emits
 * `src/apis/graphql/anilist/facade/query-group.ts` and
 * `src/apis/graphql/anilist/facade/mutation-group.ts` from the operation
 * registry and the operation classes; every member signature derives from the
 * bound method on the operation class. This file carries the prose that cannot
 * be derived: each operation's container brief, summary, `@returns` prose,
 * and `@example` block.
 *
 * Keys are `<category>:<name>` (e.g. `"query:user"`, `"page:following"`,
 * `"mutation:saveThread"`) because facade keys are not unique across
 * categories. The generator fails when a key is missing or unknown, so adding
 * a registry operation without prose fails loudly.
 */

/**
 * Curated prose for one facade operation member.
 */
export interface FacadeOperationDoc {
    /**
     * Text for the container `@property {Function} <name> - <brief>` line.
     */
    readonly brief: string;
    /**
     * Summary line(s) of the member JSDoc; embedded newlines become separate
     * JSDoc lines.
     */
    readonly summary: string;
    /**
     * Prose after `@returns {Promise<...>}`; embedded newlines become
     * separate JSDoc lines.
     */
    readonly returns: string;
    /**
     * Full `@example` block content (fence plus any surrounding prose lines).
     */
    readonly example: string;
    /**
     * Override for the `@param variables` description; `{variables}` is
     * replaced with the variables type derived from the operation class.
     * Defaults to `The {@link {variables}} for the query.` (or `for the
     * mutation.`).
     */
    readonly paramVariables?: string;
    /**
     * `@deprecated` prose; emitted only when present.
     */
    readonly deprecated?: string;
    /**
     * Insert a blank JSDoc line between the summary and the first tag.
     */
    readonly blankAfterSummary?: boolean;
    /**
     * Override for the member `@see` URL; defaults to the first `@see` of
     * the bound class method's JSDoc.
     */
    readonly see?: string;
    /**
     * Override for the variables type in the member signature. Defaults to
     * the variables type of the bound method on the operation class. Used
     * where the facade intentionally exposes a wider type than the class
     * method declares (e.g. `query:viewer` accepts `UserVariables` even
     * though `ViewerQuery.viewer` takes `ViewerVariables`, a strict
     * subset; `mutation:toggleLikeV2` accepts `ToggleLikeVariables` even
     * though the class takes `ToggleLikeV2Variables`).
     */
    readonly variablesType?: string;
}

/**
 * Curated prose per operation, keyed `<category>:<name>`.
 */
export const FACADE_OPERATION_DOCS: Record<string, FacadeOperationDoc> = {
    "query:user": {
        brief: "Fetches user data from the AniList API.",
        summary:
            "`UserQuery` fetches a single user by `id` or `name`. Returns a {@link UserResponse}.",
        returns: "A promise that resolves to the user's {@link UserResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.user({id: 542244, asHtml: true});\n```",
    },
    "query:media": {
        brief: "Fetches media data from the AniList API.",
        summary:
            "`MediaQuery` fetches the media data for a single anime or manga by `id` or `idMal`. Returns a {@link MediaResponse}.",
        returns: "A promise that resolves to the {@link MediaResponse} data.",
        example: "```typescript\nawait aniLink.anilist.query.media({id: 1, type: 'ANIME'});\n```",
    },
    "query:mediaTrend": {
        brief: "Fetches media trend data from the AniList API.",
        summary:
            "`MediaTrendQuery` fetches a single daily trend entry for one media by `mediaId` or a date/stat filter. Returns a {@link MediaTrendResponse}.",
        returns: "A promise that resolves to the {@link MediaTrendResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.mediaTrend({mediaId: 1});\n```\nA trend entry is one media's statistics for a single day.",
    },
    "query:airingSchedule": {
        brief: "Fetches airing schedule data from the AniList API.",
        summary:
            "`AiringScheduleQuery` fetches a single airing schedule entry by `id` or `mediaId`. Returns an {@link AiringScheduleResponse}.",
        returns: "A promise that resolves to the {@link AiringScheduleResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.airingSchedule({mediaId: 130590});\n```\nAt least one variable other than `asHtml` must be set. AniList only guarantees that future airing data is present and accurate.",
    },
    "query:character": {
        brief: "Fetches character data from the AniList API.",
        summary:
            "`CharacterQuery` fetches a single character by `id` or `search`. Returns a {@link CharacterResponse}.",
        returns: "A promise that resolves to the {@link CharacterResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.character({\n  id: 1,\n  asHtml: true,\n  mediaSort: ['POPULARITY_DESC'],\n  mediaOnList: true,\n  mediaPage: 1,\n  mediaPerPage: 10\n});\n```",
    },
    "query:staff": {
        brief: "Fetches staff data from the AniList API.",
        summary:
            "`StaffQuery` fetches a single staff member by `id` or `search`. Returns a {@link StaffResponse}.",
        returns: "A promise that resolves to the {@link StaffResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.staff({\n  id: 132186,\n  asHtml: true,\n  staffMediaSort: ['POPULARITY_DESC'],\n  staffMediaType: 'ANIME',\n  staffMediaOnList: true,\n  staffMediaPage: 1,\n  staffMediaPerPage: 10,\n  charactersSort: ['ID'],\n  charactersPage: 1,\n  charactersPerPage: 10,\n  characterMediaSort: ['POPULARITY_DESC'],\n  characterMediaOnList: true,\n  characterMediaPage: 1,\n  characterMediaPerPage: 10\n});\n```",
    },
    "query:mediaList": {
        brief: "Fetches media list data from the AniList API.",
        summary:
            "`MediaListQuery` fetches a single media list entry by `id`, or by `userName`/`userId` plus `mediaId`. Returns a {@link MediaListResponse}.",
        returns: "A promise that resolves to the {@link MediaListResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.mediaList({userId: 542244, mediaId: 1});\n```",
    },
    "query:mediaListCollection": {
        brief: "Fetches media list collection data from the AniList API.",
        summary:
            "`MediaListCollectionQuery` fetches a user's full list collection, chunked via `chunk`/`perChunk`. Returns a {@link MediaListCollectionResponse}; flatten it with `aniLink.anilist.flattenMediaListCollection`.",
        returns: "A promise that resolves to the {@link MediaListCollectionResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.mediaListCollection({\n  userId: 542244,\n  type: 'ANIME',\n  status: 'COMPLETED',\n  chunk: 1,\n  perChunk: 10000\n});\n```",
    },
    "query:genreCollection": {
        brief: "Fetches genre collection data from the AniList API.",
        summary:
            "`GenreCollectionQuery` returns the list of all genres recognized by AniList. No variables are required.",
        returns: "A promise that resolves to the genre collection data (a list of genre strings).",
        example: "```typescript\nawait aniLink.anilist.query.genreCollection()\n```",
    },
    "query:mediaTagCollection": {
        brief: "Fetches media tag collection data from the AniList API.",
        summary:
            "`MediaTagCollectionQuery` returns all media tags recognized by AniList, optionally filtered by media `status` (mod-only). Returns a {@link MediaTagCollectionResponse}.",
        returns: "A promise that resolves to the {@link MediaTagCollectionResponse} data.",
        example: "```typescript\nawait aniLink.anilist.query.mediaTagCollection()\n```",
        paramVariables:
            "Optional media `status` filter, honored for moderator accounts; a {@link {variables}}.",
    },
    "query:viewer": {
        brief: "Fetches viewer data from the AniList API.",
        summary:
            "`ViewerQuery` fetches the currently authenticated user. Returns a {@link UserResponse}.",
        returns: "A promise that resolves to the {@link UserResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.viewer({asHtml: true});\n```\nMust be authenticated.",
        variablesType: "UserVariables",
    },
    "query:notification": {
        brief: "Fetches notification data from the AniList API.",
        summary:
            "`NotificationQuery` fetches a single notification for the authenticated user, optionally filtered by `type`/`type_in`; `resetNotificationCount` resets the unread count. Returns a {@link NotificationResponse}. Must be authenticated.",
        returns: "A promise that resolves to the {@link NotificationResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.notification({type: 'AIRING', resetNotificationCount: true});\n```\nMust be authenticated.",
    },
    "query:studio": {
        brief: "Fetches studio data from the AniList API.",
        summary:
            "`StudioQuery` fetches a single studio by `id` or `search`. Returns a {@link StudioResponse}.",
        returns: "A promise that resolves to the {@link StudioResponse} data.",
        example: "```typescript\nawait aniLink.anilist.query.studio({id: 561, asHtml: true});\n```",
    },
    "query:review": {
        brief: "Fetches review data from the AniList API.",
        summary: "`ReviewQuery` fetches a single review by `id`. Returns a {@link ReviewResponse}.",
        returns: "A promise that resolves to the {@link ReviewResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.review({id: 8008, asHtml: true});\n```",
    },
    "query:activity": {
        brief: "Fetches activity data from the AniList API.",
        summary:
            "`ActivityQuery` fetches a single activity by `id`. Returns an {@link Activity} (a union of text, message, and list activities).",
        returns: "A promise that resolves to the {@link Activity} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.activity({id: 723235883, asHtml: true});\n```",
    },
    "query:activityReply": {
        brief: "Fetches activity reply data from the AniList API.",
        summary:
            "`ActivityReplyQuery` fetches a single activity reply by `id`. Returns an {@link ActivityReply}.",
        returns: "A promise that resolves to the {@link ActivityReply} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.activityReply({id: 12191046, asHtml: true});\n```",
    },
    "query:following": {
        brief: "Fetches following data from the AniList API.",
        summary:
            "`FollowingQuery` fetches a single user that the given `userId` follows. Returns a {@link UserResponse}.",
        returns: "A promise that resolves to the {@link UserResponse} data.",
        example: "```typescript\nawait aniLink.anilist.query.following({userId: 542244});\n```",
    },
    "query:follower": {
        brief: "Fetches follower data from the AniList API.",
        summary:
            "`FollowerQuery` fetches a single follower of the given `userId`. Returns a {@link UserResponse}.",
        returns: "A promise that resolves to the {@link UserResponse} data.",
        example: "```typescript\nawait aniLink.anilist.query.follower({userId: 542244});\n```",
    },
    "query:thread": {
        brief: "Fetches thread data from the AniList API.",
        summary:
            "`ThreadQuery` fetches a single forum thread by `id`. Returns a {@link ThreadResponse}.",
        returns: "A promise that resolves to the {@link ThreadResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.thread({id: 71881, asHtml: true});\n```",
    },
    "query:threadComment": {
        brief: "Fetches thread comment data from the AniList API.",
        summary:
            "`ThreadCommentQuery` fetches thread comments filtered by `id`, `threadId`, or `userId`; at least one variable other than `asHtml` must be set. AniList types the field as a list, so the resolved value is an array even when the filters match one comment. Returns a {@link ThreadCommentResponse}.",
        returns: "A promise that resolves to the {@link ThreadCommentResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.threadComment({id: 2555166, asHtml: true});\n```",
    },
    "query:recommendation": {
        brief: "Fetches recommendation data from the AniList API.",
        summary:
            "`RecommendationQuery` fetches a single recommendation by `id` or `mediaId`. Returns a {@link RecommendationResponse}.",
        returns: "A promise that resolves to the {@link RecommendationResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.recommendation({mediaId: 156822, asHtml: true});\n```",
    },
    "query:markdown": {
        brief: "Fetches markdown data from the AniList API.",
        summary:
            "`MarkdownQuery` parses AniList markdown into HTML. Returns the rendered HTML string. Must be authenticated.",
        returns: "A promise that resolves to the rendered HTML string.",
        example:
            "```typescript\nawait aniLink.anilist.query.markdown({markdown: 'Hello, world!'});\n```\nMust be authenticated.",
    },
    "query:aniChartUser": {
        brief: "Fetches AniChart user data from the AniList API.",
        summary:
            "`AniChartUserQuery` fetches the authenticated user's AniChart profile — `user`, `settings`, and `highlights`. Returns an {@link AniChartUserResponse}. Must be authenticated.",
        returns: "A promise that resolves to the {@link AniChartUserResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.query.aniChartUser();\n```\nMust be authenticated.",
    },
    "query:siteStatistics": {
        brief: "Fetches site statistics data from the AniList API.",
        summary:
            "`SiteStatisticsQuery` fetches aggregate AniList site statistics with optional per-entity sort and pagination controls. Returns a {@link SiteStatisticsResponse}.",
        returns: "A promise that resolves to the {@link SiteStatisticsResponse} data.",
        example: "```typescript\nawait aniLink.anilist.query.siteStatistics();\n```",
        paramVariables: "Optional per-entity sort and pagination controls; a {@link {variables}}.",
    },
    "query:externalLinkSourceCollection": {
        brief: "Fetches external link source collection data from the AniList API.",
        summary:
            "`ExternalLinkSourceCollectionQuery` returns the available external link sources, optionally filtered by `id`, `type`, or `mediaType`. Returns an {@link ExternalLinkSourceCollectionResponse}.",
        returns:
            "A promise that resolves to the {@link ExternalLinkSourceCollectionResponse} data.",
        example: "```typescript\nawait aniLink.anilist.query.externalLinkSourceCollection();\n```",
        paramVariables: "Optional `id`, `type`, or `mediaType` filters; a {@link {variables}}.",
        see: "https://docs.anilist.co/reference/query",
    },
    "page:users": {
        brief: "Fetches users data from the AniList API.",
        summary:
            "`UsersQuery` fetches a page of users. Returns a {@link UsersPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link UsersPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.users({page: 1, perPage: 10});\n```",
    },
    "page:medias": {
        brief: "Fetches medias data from the AniList API.",
        summary:
            "`MediasQuery` fetches a page of anime/manga. Returns a {@link MediasPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link MediasPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.medias({page: 1, perPage: 10, type: 'ANIME'});\n```",
    },
    "page:characters": {
        brief: "Fetches characters data from the AniList API.",
        summary:
            "`CharactersQuery` fetches a page of characters. Returns a {@link CharactersPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link CharactersPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.characters({page: 1, perPage: 10});\n```",
    },
    "page:staffs": {
        brief: "Fetches staffs data from the AniList API.",
        summary:
            "`StaffsQuery` fetches a page of staff members. Returns a {@link StaffsPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link StaffsPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.staffs({page: 1, perPage: 10});\n```",
    },
    "page:studios": {
        brief: "Fetches studios data from the AniList API.",
        summary:
            "`StudiosQuery` fetches a page of studios. Returns a {@link StudiosPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link StudiosPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.studios({page: 1, perPage: 10});\n```",
    },
    "page:mediaLists": {
        brief: "Fetches media lists data from the AniList API.",
        summary:
            "`MediaListsQuery` fetches a page of media list entries. Returns a {@link MediaListsPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link MediaListsPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.mediaLists({page: 1, perPage: 10, userId: 542244});\n```",
    },
    "page:airingSchedules": {
        brief: "Fetches airing schedules data from the AniList API.",
        summary:
            "`AiringSchedulesQuery` fetches a page of airing schedule entries. Returns an {@link AiringSchedulesPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link AiringSchedulesPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.airingSchedules({page: 1, perPage: 10});\n```",
    },
    "page:mediaTrends": {
        brief: "Fetches media trends data from the AniList API.",
        summary:
            "`MediaTrendsQuery` fetches a page of media trend entries. Returns a {@link MediaTrendsPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link MediaTrendsPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.mediaTrends({page: 1, perPage: 10, mediaId: 1});\n```\nEach entry is one media's statistics for a single day.",
    },
    "page:notifications": {
        brief: "Fetches notifications data from the AniList API.",
        summary:
            "`NotificationsQuery` fetches a page of the authenticated user's notifications. Returns a {@link NotificationsPageResponse} with the items and `PageInfo`. Must be authenticated.",
        returns:
            "A promise that resolves to the {@link NotificationsPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.notifications({page: 1, perPage: 10});\n```",
    },
    "page:followers": {
        brief: "Fetches followers data from the AniList API.",
        summary:
            "`FollowersQuery` fetches a page of a user's followers. Returns a {@link FollowersPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link FollowersPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.followers({page: 1, perPage: 10, userId: 542244});\n```",
    },
    "page:following": {
        brief: "Fetches following data from the AniList API.",
        summary:
            "`FollowingsQuery` fetches a page of users that the given `userId` follows. Returns a {@link FollowingsPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link FollowingsPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.following({page: 1, perPage: 10, userId: 542244});\n```",
    },
    "page:activities": {
        brief: "Fetches activities data from the AniList API.",
        summary:
            "`ActivitiesQuery` fetches a page of activities. Returns an {@link ActivitiesPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link ActivitiesPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.activities({page: 1, perPage: 10, userId: 542244});\n```",
    },
    "page:activityReplies": {
        brief: "Fetches activity replies data from the AniList API.",
        summary:
            "`ActivityRepliesQuery` fetches a page of replies for an activity. Returns an {@link ActivityRepliesPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link ActivityRepliesPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.activityReplies({page: 1, perPage: 10, activityId: 723235883});\n```",
    },
    "page:threads": {
        brief: "Fetches threads data from the AniList API.",
        summary:
            "`ThreadsQuery` fetches a page of forum threads. Returns a {@link ThreadsPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link ThreadsPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.threads({page: 1, perPage: 10});\n```",
    },
    "page:threadComments": {
        brief: "Fetches thread comments data from the AniList API.",
        summary:
            "`ThreadCommentsQuery` fetches a page of comments for a thread. Returns a {@link ThreadCommentsPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link ThreadCommentsPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.threadComments({page: 1, perPage: 10, threadId: 71881});\n```",
    },
    "page:reviews": {
        brief: "Fetches reviews data from the AniList API.",
        summary:
            "`ReviewsQuery` fetches a page of reviews. Returns a {@link ReviewsPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link ReviewsPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.reviews({page: 1, perPage: 10, mediaId: 1});\n```",
    },
    "page:recommendations": {
        brief: "Fetches recommendations data from the AniList API.",
        summary:
            "`RecommendationsQuery` fetches a page of recommendations. Returns a {@link RecommendationsPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link RecommendationsPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.recommendations({page: 1, perPage: 10, mediaId: 1});\n```",
    },
    "page:likes": {
        brief: "Fetches likes data from the AniList API.",
        summary:
            "`LikesQuery` fetches a page of users who liked a likeable entity. Returns a {@link LikesPageResponse} with the items and `PageInfo`.",
        returns:
            "A promise that resolves to the {@link LikesPageResponse} data and pagination metadata.",
        example:
            "```typescript\nawait aniLink.anilist.query.page.likes({page: 1, perPage: 10, likeableId: 1, type: 'ACTIVITY'});\n```\nBoth `likeableId` and `type` are required.",
    },
    "mutation:updateUser": {
        brief: "Updates the authenticated user on the AniList API.",
        summary: "`UpdateUserMutation` updates the authenticated user's profile and list settings.",
        returns: "A promise that resolves to the {@link UpdateUserResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.updateUser({\n  about: 'New about text',\n  titleLanguage: 'ENGLISH',\n  displayAdultContent: true,\n  airingNotifications: true,\n  scoreFormat: 'POINT_10',\n  rowOrder: 'title',\n  profileColor: 'blue',\n  donatorBadge: 'Supporter',\n  notificationOptions: [{type: 'AIRING', enabled: true}],\n  timezone: '-06:00',\n  activityMergeTime: 30,\n  animeListOptions: {sectionOrder: ['title'], customLists: ['test'], advancedScoring: [], advancedScoringEnabled: false},\n  mangaListOptions: {sectionOrder: ['title'], customLists: ['test'], advancedScoring: [], advancedScoringEnabled: false},\n  staffNameLanguage: 'ROMAJI',\n  restrictMessagesToFollowing: false,\n  disabledListActivity: [{type: 'CURRENT', disabled: false}]\n});\n```",
    },
    "mutation:saveMediaListEntry": {
        brief: "Saves a media list entry on the AniList API.",
        summary:
            "`SaveMediaListEntryMutation` creates or updates the authenticated user's list entry for one media; `mediaId` is required, `id` only when updating.",
        returns: "A promise that resolves to the {@link MediaListResponse} data.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.saveMediaListEntry({mediaId: 1, status: 'COMPLETED'});\n```",
    },
    "mutation:updateMediaListEntries": {
        brief: "Updates media list entries on the AniList API.",
        summary:
            "`UpdateMediaListEntriesMutation` applies one set of changes to every list entry in `ids`.",
        returns:
            "A promise that resolves to an array of {@link MediaListResponse} entries, one per id.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.updateMediaListEntries({\n  status: 'CURRENT',\n  score: 8.5,\n  progress: 3,\n  ids: [143271, 156822, 170890],\n});\n```",
    },
    "mutation:deleteMediaListEntry": {
        brief: "Deletes a media list entry.",
        summary:
            "`DeleteMediaListEntryMutation` deletes one of the authenticated user's list entries by entry `id`.",
        returns:
            "A promise that resolves to a {@link DeleteMediaListEntryResponse} — `{ deleted }`, where `deleted` is `true` when the entry was deleted by this call and `false` when it was already absent.",
        example:
            "You cannot delete a media list entry without first fetching the entry's id. The entry's id is not the same as the mediaId. It is specific to each user and media.\n```typescript\nawait aniLink.anilist.mutation.deleteMediaListEntry({id: 1});\n```",
    },
    "mutation:deleteCustomList": {
        brief: "Deletes a custom list.",
        summary:
            "`DeleteCustomListMutation` deletes a custom list and removes its entries. There is no mutation for creating a custom list; create one through `UpdateUserMutation` under the `animeListOptions` or `mangaListOptions` variables.",
        returns:
            "A promise that resolves to `{ deleted }`, where `deleted` is `true` when the custom list was deleted by this call and `false` when it was already absent.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.deleteCustomList({customList: 'test', type: 'ANIME'});\n```",
    },
    "mutation:saveTextActivity": {
        brief: "Saves a text activity on the AniList API.",
        summary:
            "`SaveTextActivityMutation` creates or updates the authenticated user's text activity; `id` is required only when updating.",
        returns: "A promise that resolves to the saved {@link Activity}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.saveTextActivity({id: 1, text: 'Hello, world!'});\n```",
    },
    "mutation:saveMessageActivity": {
        brief: "Saves a message activity on the AniList API.",
        summary:
            "`SaveMessageActivityMutation` creates or updates a message activity for the authenticated user; `id` is required only when updating.",
        returns: "A promise that resolves to the saved {@link Activity}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.saveMessageActivity({id: 1, message: 'Hello, world!'});\n```",
    },
    "mutation:saveListActivity": {
        brief: "Saves a list activity on the AniList API.",
        summary: "`SaveListActivityMutation` saves a list activity on the AniList API.\nMod Only",
        returns: "A promise that resolves to the saved {@link Activity}.",
        example: "```typescript\nawait aniLink.anilist.mutation.saveListActivity({id: 1});\n```",
    },
    "mutation:deleteActivity": {
        brief: "Deletes an activity on the AniList API.",
        summary: "`DeleteActivityMutation` deletes one of the authenticated user's own activities.",
        returns:
            "A promise that resolves to `{ deleted }`, where `deleted` is `true` when the activity was deleted by this call and `false` when it was already absent.",
        example: "```typescript\nawait aniLink.anilist.mutation.deleteActivity({id: 1});\n```",
    },
    "mutation:toggleActivityPin": {
        brief: "Toggles an activity's pin status on the AniList API.",
        summary:
            "`ToggleActivityPinMutation` pins or unpins an activity on the authenticated user's activity feed.",
        returns: "A promise that resolves to the updated {@link Activity}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.toggleActivityPin({id: 1, pinned: true});\n```",
        blankAfterSummary: true,
    },
    "mutation:toggleActivitySubscription": {
        brief: "Toggles an activity's subscription status.",
        summary:
            "`ToggleActivitySubscriptionMutation` subscribes or unsubscribes the authenticated user from an activity.",
        returns: "A promise that resolves to the updated {@link Activity}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.toggleActivitySubscription({activityId: 1, subscribe: true});\n```",
        blankAfterSummary: true,
    },
    "mutation:saveActivityReply": {
        brief: "Saves an activity reply on the AniList API.",
        summary:
            "`SaveActivityReplyMutation` creates or updates a reply on an activity; `id` is required only when updating.",
        returns: "A promise that resolves to the saved {@link ActivityReply}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.saveActivityReply({id: 1, activityId: 2, text: 'Hello, world!'});\n```",
    },
    "mutation:deleteActivityReply": {
        brief: "Deletes an activity reply.",
        summary:
            "`DeleteActivityReplyMutation` deletes one of the authenticated user's activity replies by `id`.",
        returns:
            "A promise that resolves to `{ deleted }`, where `deleted` is `true` when the reply was deleted by this call and `false` when it was already absent.",
        example: "```typescript\nawait aniLink.anilist.mutation.deleteActivityReply({id: 1});\n```",
    },
    "mutation:toggleLike": {
        brief: "Toggles a like.",
        summary: "`ToggleLikeMutation` toggles the authenticated user's like on a likeable entity.",
        returns: "A promise that resolves to the {@link BasicUser} who performed the like toggle.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.toggleLike({id: 1, type: 'ACTIVITY'});\n```",
        deprecated:
            "Use `toggleLikeV2` instead, which returns the richer {@link Likeable} union (activity, activity reply, thread, or thread comment) instead of a bare user.",
    },
    "mutation:toggleLikeV2": {
        brief: "Toggles a like on the AniList API.",
        summary:
            "`ToggleLikeV2Mutation` toggles the authenticated user's like on a likeable entity, returning the liked entity itself.",
        returns:
            "A promise that resolves to the liked {@link Likeable} entity: an activity,\nactivity reply, thread, or thread comment depending on the likeable type.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.toggleLikeV2({id: 1, type: 'ACTIVITY'});\n```",
        variablesType: "ToggleLikeVariables",
    },
    "mutation:toggleFollow": {
        brief: "Toggles a follow on the AniList API.",
        summary:
            "`ToggleFollowMutation` toggles the authenticated user's follow of the user named by `userId`.",
        returns: "A promise that resolves to the updated {@link UserResponse}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.toggleFollow({userId: 542244});\n```",
    },
    "mutation:toggleFavourite": {
        brief: "Toggles a favourite on the AniList API.",
        summary:
            "`ToggleFavouriteMutation` toggles the authenticated user's favourite on an anime, manga, character, staff member, or studio; pass the id of the entity to toggle.",
        returns: "A promise that resolves to the updated {@link Favourites}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.toggleFavourite({studioId: 561});\n```",
    },
    "mutation:updateFavouriteOrder": {
        brief: "Updates a favourite order.",
        summary:
            "`UpdateFavouriteOrderMutation` rewrites the display order of the authenticated user's favourites in every category.",
        returns: "A promise that resolves to the updated {@link Favourites}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.updateFavouriteOrder({\n  animeIds: [1],\n  mangaIds: [],\n  characterIds: [],\n  staffIds: [],\n  studioIds: [],\n  animeOrder: [1],\n  mangaOrder: [],\n  characterOrder: [],\n  staffOrder: [],\n  studioOrder: [],\n});\n```",
    },
    "mutation:saveReview": {
        brief: "Saves a review on the AniList API.",
        summary: "`SaveReviewMutation` creates or updates a review.",
        returns: "A promise that resolves to the saved {@link ReviewResponse}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.saveReview({id: 1, mediaId: 1, body: 'testing', summary: 'testing', score: 8, private: true});\n```",
    },
    "mutation:rateReview": {
        brief: "Rates a review.",
        summary:
            "`RateReviewMutation` sets the authenticated user's rating (`UP_VOTE`/`DOWN_VOTE`) on a review.",
        returns: "A promise that resolves to the rated {@link ReviewResponse}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.rateReview({reviewId: 8008, rating: 'UP_VOTE'});\n```",
    },
    "mutation:deleteReview": {
        brief: "Deletes a review.",
        summary: "`DeleteReviewMutation` deletes one of the authenticated user's reviews by `id`.",
        returns:
            "A promise that resolves to `{ deleted }`, where `deleted` is `true` when the review was deleted by this call and `false` when it was already absent.",
        example: "```typescript\nawait aniLink.anilist.mutation.deleteReview({id: 1});\n```",
    },
    "mutation:saveRecommendation": {
        brief: "Saves a recommendation on the AniList API.",
        summary:
            "`SaveRecommendationMutation` creates or updates the authenticated user's rating recommending one media for another.",
        returns: "A promise that resolves to the saved {@link RecommendationResponse}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.saveRecommendation({mediaId: 1, mediaRecommendationId: 2, rating: 'RATE_UP'});\n```",
    },
    "mutation:saveThread": {
        brief: "Saves a thread on the AniList API.",
        summary: "`SaveThreadMutation` creates or updates a forum thread.",
        returns: "A promise that resolves to the saved {@link ThreadResponse}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.saveThread({\n  id: 1,\n  title: 'Hello, world!',\n  body: 'Hello, world!',\n  categories: [],\n  mediaCategories: [],\n  sticky: false,\n  locked: false,\n  asHtml: true,\n});\n```",
    },
    "mutation:deleteThread": {
        brief: "Deletes a thread.",
        summary: "`DeleteThreadMutation` deletes a forum thread by `id`.",
        returns:
            "A promise that resolves to `{ deleted }`, where `deleted` is `true` when the thread was deleted by this call and `false` when it was already absent.",
        example: "```typescript\nawait aniLink.anilist.mutation.deleteThread({id: 1});\n```",
    },
    "mutation:toggleThreadSubscription": {
        brief: "Toggles a thread's subscription status.",
        summary:
            "`ToggleThreadSubscriptionMutation` subscribes or unsubscribes the authenticated user from a thread.",
        returns: "A promise that resolves to the updated {@link ThreadResponse}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.toggleThreadSubscription({threadId: 1, subscribe: true});\n```",
    },
    "mutation:saveThreadComment": {
        brief: "Saves a thread comment on the AniList API.",
        summary: "`SaveThreadCommentMutation` creates or updates a comment on a thread.",
        returns: "A promise that resolves to the saved {@link ThreadCommentResponse}.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.saveThreadComment({\n  id: 1,\n  threadId: 1,\n  parentCommentId: 0,\n  comment: 'Hello, world!',\n  locked: false,\n  asHtml: true,\n});\n```",
    },
    "mutation:deleteThreadComment": {
        brief: "Deletes a thread comment.",
        summary: "`DeleteThreadCommentMutation` deletes a thread comment by `id`.",
        returns:
            "A promise that resolves to `{ deleted }`, where `deleted` is `true` when the comment was deleted by this call and `false` when it was already absent.",
        example: "```typescript\nawait aniLink.anilist.mutation.deleteThreadComment({id: 1});\n```",
    },
    "mutation:updateAniChartSettings": {
        brief: "Updates AniChart settings on the AniList API.",
        summary:
            "`UpdateAniChartSettingsMutation` updates the authenticated user's AniChart display settings.",
        returns: "A promise that resolves to the updated AniChart settings string.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.updateAniChartSettings({\n  titleLanguage: 'romaji',\n  outgoingLinkProvider: 'ANILIST',\n  theme: 'dark',\n  sort: 'POPULARITY',\n});\n```",
    },
    "mutation:updateAniChartHighlights": {
        brief: "Updates AniChart highlights on the AniList API.",
        summary:
            "`UpdateAniChartHighlightsMutation` sets or clears the authenticated user's AniChart highlights.",
        returns: "A promise that resolves to the updated AniChart highlights string.",
        example:
            "```typescript\nawait aniLink.anilist.mutation.updateAniChartHighlights({\n  highlights: {mediaId: 1, highlight: true},\n});\n```",
    },
};
