# Examples

Here are examples of how to use AniLink to interact with the AniList API:

## Authenticating

AniLink ships helpers for the AniList OAuth2 authorization-code flow, so you can obtain and refresh the token you pass to the `AniLink` constructor instead of hand-rolling the HTTP calls.

Register an application on the [AniList developer settings](https://anilist.co/settings/developer) to get a client ID and client secret, then send the user to the authorization URL:

```typescript
import { buildAuthorizationUrl } from "anilink-api-wrapper";

const state = crypto.randomUUID(); // a fresh random value per login attempt
const authorizeUrl = buildAuthorizationUrl("your-client-id", "https://example.com/callback", state);
// Redirect the user to `authorizeUrl`. After approval, AniList sends them back
// to your redirect URI with `?code=` and `state=` query parameters.
```

The third `state` parameter is optional but strongly recommended as CSRF protection: bind it to the user's session and validate that the `state` on the redirect matches before exchanging the code.

Exchange the authorization code from the redirect for an access token:

```typescript
import { getAccessToken, AniLink } from "anilink-api-wrapper";

const { access_token, refresh_token } = await getAccessToken(
    "your-client-id",
    "your-client-secret",
    code, // the `code` query parameter from the redirect
    "https://example.com/callback"
);

const aniLink = new AniLink(access_token);
```

When the access token expires, exchange the stored refresh token for a new one. The refresh response may not include a new `refresh_token`, in which case you keep using the one you stored:

```typescript
import { refreshAccessToken } from "anilink-api-wrapper";

const { access_token, refresh_token: rotated } = await refreshAccessToken(
    "your-client-id",
    "your-client-secret",
    refresh_token
);

const nextRefreshToken = rotated ?? refresh_token;
```

AniList reports the token lifetime as `expires_in` seconds. Use `getTokenExpiry` to refresh proactively before the token expires instead of waiting for a `401`:

```typescript
import { getTokenExpiry, refreshAccessToken } from "anilink-api-wrapper";

if (Date.now() >= getTokenExpiry(tokenResponse).getTime() - 60_000) {
    // Refresh at least a minute before expiry.
    tokenResponse = await refreshAccessToken(
        "your-client-id",
        "your-client-secret",
        nextRefreshToken
    );
}
```

Read-only operations such as public media or character queries work without any token; pass no argument to the constructor:

```typescript
const aniLink = new AniLink();
const anime = await aniLink.anilist.query.media({ id: 1, type: "ANIME" });
```

## Querying

```typescript
// Querying user data
aniLink.anilist.query.user({ id: 542244, asHtml: true });

// Querying media data
aniLink.anilist.query.media({ id: 1, type: "ANIME" });

// Querying media trend data
aniLink.anilist.query.mediaTrend({ mediaId: 1 });

// Querying airing schedule data
aniLink.anilist.query.airingSchedule({ mediaId: 130590 });

// Querying character data
aniLink.anilist.query.character({
    id: 1,
    asHtml: true,
    mediaSort: ["POPULARITY_DESC"],
    mediaOnList: true,
    mediaPage: 1,
    mediaPerPage: 10,
});

// Querying staff data
aniLink.anilist.query.staff({
    id: 132186,
    asHtml: true,
    staffMediaSort: ["POPULARITY_DESC"],
    staffMediaType: "ANIME",
    staffMediaOnList: true,
    staffMediaPage: 1,
    staffMediaPerPage: 10,
    charactersSort: ["ID"],
    charactersPage: 1,
    charactersPerPage: 10,
    characterMediaSort: ["POPULARITY_DESC"],
    characterMediaOnList: true,
    characterMediaPage: 1,
    characterMediaPerPage: 10,
});

// Querying media list data
aniLink.anilist.query.mediaList({ userId: 542244 });

// Querying media list collection data
aniLink.anilist.query.mediaListCollection({
    userId: 542244,
    type: "ANIME",
    status: "COMPLETED",
    chunk: 1,
    perChunk: 10000,
});

// Querying genre collection data
aniLink.anilist.query.genreCollection();

// Querying media tag collection data
aniLink.anilist.query.mediaTagCollection();

// Querying viewer data
aniLink.anilist.query.viewer({ asHtml: true });

// Querying notification data
aniLink.anilist.query.notification({ asHtml: true });

// Querying studio data
aniLink.anilist.query.studio({ id: 561, asHtml: true });

// Querying review data
aniLink.anilist.query.review({ id: 8008, asHtml: true });

// Querying activity data
aniLink.anilist.query.activity({ id: 723235883, asHtml: true });

// Querying activity reply data
aniLink.anilist.query.activityReply({ id: 12191046, asHtml: true });

// Querying following data
aniLink.anilist.query.following({ userId: 542244, asHtml: true });

// Querying follower data
aniLink.anilist.query.follower({ userId: 542244, asHtml: true });

// Querying thread data
aniLink.anilist.query.thread({ id: 71881, asHtml: true });

// Querying thread comment data
aniLink.anilist.query.threadComment({ id: 2555166, asHtml: true });

// Querying recommendation data
aniLink.anilist.query.recommendation({ mediaId: 156822, asHtml: true });

// Querying markdown data
aniLink.anilist.query.markdown({ markdown: "Hello" });

// Querying AniChartUser data
aniLink.anilist.query.aniChartUser();

// Querying site statistics data
aniLink.anilist.query.siteStatistics();

// Querying external link source collection data
aniLink.anilist.query.externalLinkSourceCollection();

// Querying users page data
aniLink.anilist.query.page.users({ id: 542244, asHtml: true });

// Querying media page data
aniLink.anilist.query.page.medias({ id: 1, type: "ANIME" });

// Querying character page data
aniLink.anilist.query.page.characters({ id: 1, asHtml: true });

// Querying staff page data
aniLink.anilist.query.page.staffs({ id: 132186, asHtml: true });

// Querying studio page data
aniLink.anilist.query.page.studios({ id: 561, asHtml: true });

// Querying media list page data
aniLink.anilist.query.page.mediaLists({ userId: 542244 });

// Querying airing schedule page data
aniLink.anilist.query.page.airingSchedules({ mediaId: 130590 });

// Querying media trend page data
aniLink.anilist.query.page.mediaTrends({ mediaId: 1 });

// Querying notification page data
aniLink.anilist.query.page.notifications({ asHtml: true });

// Querying follower page data
aniLink.anilist.query.page.followers({ userId: 542244, asHtml: true });

// Querying following page data
aniLink.anilist.query.page.following({ userId: 542244, asHtml: true });

// Querying activity page data
aniLink.anilist.query.page.activities({ id: 723235883, asHtml: true });

// Querying activity reply page data
aniLink.anilist.query.page.activityReplies({ id: 12191046, asHtml: true });

// Querying thread page data
aniLink.anilist.query.page.threads({ id: 71881, asHtml: true });

// Querying thread comment page data
aniLink.anilist.query.page.threadComments({ threadId: 71881, asHtml: true });

// Querying review page data
aniLink.anilist.query.page.reviews({ id: 8008, asHtml: true });

// Querying recommendation page data
aniLink.anilist.query.page.recommendations({ mediaId: 156822, asHtml: true });

// Querying likes page data
aniLink.anilist.query.page.likes({ likeableId: 723422275, type: "ACTIVITY" });
```

## Paginating

```typescript
// Fetching a single page
aniLink.anilist.query.page.medias({
    page: 1,
    perPage: 10,
    type: "ANIME",
    sort: ["POPULARITY_DESC"],
});

// Collecting every item across all pages with paginate
// (concurrency keeps up to 4 page requests in flight; results stay in page order)
const result = await aniLink.anilist.paginate(
    (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" }),
    "media",
    { perPage: 50, maxPages: 10, concurrency: 4 }
);
console.log(result.items.length, result.pageCount, result.truncated);

// Streaming each raw page with paginatePages (early exit without buffering everything)
for await (const page of aniLink.anilist.paginatePages((page, perPage) =>
    aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" })
)) {
    console.log(page.pageInfo.currentPage, page.media.length);
    if (page.media.length > 0 && page.media[0].id === 1) break;
}

// Walking MediaListCollection chunks with paginateChunks
const chunked = await aniLink.anilist.paginateChunks(
    (chunk, perChunk) =>
        aniLink.anilist.query.mediaListCollection({
            userId: 542244,
            type: "ANIME",
            chunk,
            perChunk,
        }),
    "lists",
    { perChunk: 500, maxChunks: 20 }
);
console.log(chunked.items.length, chunked.chunkCount, chunked.truncated);
```

## Mutating

```typescript
// Updating a user
aniLink.anilist.mutation.updateUser({
    about: "New about text",
    titleLanguage: "ENGLISH",
    displayAdultContent: true,
    airingNotifications: true,
    scoreFormat: "POINT_10",
    rowOrder: "title",
    profileColor: "blue",
    donatorBadge: "Supporter",
    notificationOptions: [{ type: "AIRING", enabled: true }],
    timezone: "-06:00",
    activityMergeTime: 30,
    animeListOptions: {
        sectionOrder: ["title"],
        customLists: ["test"],
        advancedScoring: [],
        advancedScoringEnabled: false,
    },
    mangaListOptions: {
        sectionOrder: ["title"],
        customLists: ["test"],
        advancedScoring: [],
        advancedScoringEnabled: false,
    },
    staffNameLanguage: "ROMAJI",
    restrictMessagesToFollowing: false,
    disabledListActivity: [{ type: "CURRENT", disabled: false }],
});

// Saving media list entries
aniLink.anilist.mutation.saveMediaListEntry({
    mediaId: 143271,
    status: "CURRENT",
    score: 8.5,
    progress: 3,
});

// Updating media list entries
aniLink.anilist.mutation.updateMediaListEntries({
    status: "CURRENT",
    score: 8.5,
    progress: 3,
    ids: [143271, 156822, 170890],
});

// Deleting media list entry
aniLink.anilist.mutation.deleteMediaListEntry({ id: 1 });

// Deleting custom list
aniLink.anilist.mutation.deleteCustomList({ customList: "test", type: "ANIME" });

// Create text activity
aniLink.anilist.mutation.saveTextActivity({ text: "test" });

// Update text activity
aniLink.anilist.mutation.saveTextActivity({ id: 725254160, text: "Updated Text" });

// Create message activity
aniLink.anilist.mutation.saveMessageActivity({ recipientId: 542244, message: "test" });

// Update message activity
aniLink.anilist.mutation.saveMessageActivity({ id: 725254160, message: "Updated Message" });

// Update list activity
// Mod only
aniLink.anilist.mutation.saveListActivity({ id: 725254160 });

// Delete Activity
aniLink.anilist.mutation.deleteActivity({ id: 1 });

// Toggle Activity Pin
aniLink.anilist.mutation.toggleActivityPin({ id: 1, pinned: true });

// Toggle Activity Subscription
aniLink.anilist.mutation.toggleActivitySubscription({ activityId: 1, subscribe: true });

// Save Activity Reply
aniLink.anilist.mutation.saveActivityReply({ activityId: 1, text: "test" });

// Update Activity Reply
aniLink.anilist.mutation.saveActivityReply({ id: 1, text: "Updated Text" });

// Delete Activity Reply
aniLink.anilist.mutation.deleteActivityReply({ id: 1 });

// Toggle Like
aniLink.anilist.mutation.toggleLike({ id: 1, type: "ACTIVITY" });

// Toggle Like V2
aniLink.anilist.mutation.toggleLikeV2({ id: 1, type: "ACTIVITY" });

// Toggle Follow
aniLink.anilist.mutation.toggleFollow({ userId: 542244 });

// Toggle Favourite
aniLink.anilist.mutation.toggleFavourite({ studioId: 561 });

// Update Favourite Order
aniLink.anilist.mutation.updateFavouriteOrder({
    studioIds: [561, 562, 563],
    studioOrder: [561, 562, 563],
});

// Save Review
aniLink.anilist.mutation.saveReview({
    mediaId: 1,
    body: "a".repeat(2200), // This will create a string of 'a' with length 2200
    summary: "b".repeat(20), // This will create a string of 'b' with length 20
    score: 8,
    private: true,
});

// Update Review
aniLink.anilist.mutation.saveReview({
    id: 1,
    body: "a".repeat(2200), // This will create a string of 'a' with length 2200
    summary: "b".repeat(20), // This will create a string of 'b' with length 20
    score: 8,
    private: true,
});

// Delete Review
aniLink.anilist.mutation.deleteReview({ id: 1 });

// Rate Review
aniLink.anilist.mutation.rateReview({ reviewId: 8008, rating: "UP_VOTE" });

// Save Recommendation
aniLink.anilist.mutation.saveRecommendation({
    mediaId: 1,
    mediaRecommendationId: 495,
    rating: "NO_RATING",
});

// Save Thread
aniLink.anilist.mutation.saveThread({ title: "test", body: "test" });

// Update Thread
aniLink.anilist.mutation.saveThread({ id: 1, title: "Updated Title", body: "Updated Body" });

// Delete Thread
aniLink.anilist.mutation.deleteThread({ id: 1 });

// Toggle Thread Subscription
aniLink.anilist.mutation.toggleThreadSubscription({ threadId: 1, subscribe: true });

// Save Thread Comment
aniLink.anilist.mutation.saveThreadComment({ threadId: 1, comment: "test" });

// Update Thread Comment
aniLink.anilist.mutation.saveThreadComment({ id: 1, comment: "Updated Text" });

// Delete Thread Comment
aniLink.anilist.mutation.deleteThreadComment({ id: 1 });

// Update AniChart Settings
aniLink.anilist.mutation.updateAniChartSettings({
    titleLanguage: "romaji",
    outgoingLinkProvider: "crunchyroll",
    theme: "dark",
    sort: "popularity",
});

// Update AniChart Highlights
aniLink.anilist.mutation.updateAniChartHighlights({
    highlights: [{ mediaId: 1, highlight: true }],
});
```

## Handling errors

AniLink throws typed errors with stable `code` values. HTTP failures are represented by `AniLinkApiError` (which exposes the HTTP `status`); network, timeout, and cancellation failures use `AniLinkNetworkError`; calling an authenticated operation without a token throws `AniLinkAuthError`; GraphQL-level failures inside an HTTP 200 response throw `AniLinkGraphQLError`.

```typescript
import {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkGraphQLError,
    AniLinkNetworkError,
} from "anilink-api-wrapper";

try {
    const user = await aniLink.anilist.query.user({ id: 542244 });
    console.log(user);
} catch (error: unknown) {
    if (error instanceof AniLinkGraphQLError) {
        // The request returned HTTP 200 but carried GraphQL errors.
        console.error(error.graphqlErrors.map((e) => e.message));
        console.error(error.data); // any partial data returned alongside the errors
    } else if (error instanceof AniLinkApiError) {
        console.error(error.code, error.status, error.data);

        if (error.status === 429) {
            // Rate-limit accounting from the response headers, when present.
            console.error("Quota reset at:", error.rateLimit?.reset);
        }
    } else if (error instanceof AniLinkAuthError) {
        console.error("Token missing or rejected:", error.code, error.message);
    } else if (error instanceof AniLinkNetworkError) {
        console.error(error.code, error.message);
    } else {
        throw error;
    }
}
```

The available transport codes are `API_ERROR`, `GRAPHQL_ERROR`, `NETWORK_ERROR`, `TIMEOUT_ERROR`, `ABORTED_ERROR`, `CIRCUIT_OPEN_ERROR`, `AUTH_ERROR`, `VALIDATION_ERROR`, and `UNKNOWN_ERROR`. When AniList includes rate-limit headers (`x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`), every `AniLinkApiError` exposes them as a read-only `rateLimit` object so schedulers and UIs can self-throttle.

## Retrying transient failures

Retries for transient failures are automatic. The default policy retries up to 3 attempts with exponential backoff, honors the `Retry-After` header on `429` responses, and never retries mutations unless you opt in:

```typescript
import { AniLink } from "anilink-api-wrapper";

// Opt out of the default policy
const aniLink = new AniLink("your-auth-token", { retry: false });

// Or tune the default policy
const tuned = new AniLink("your-auth-token", {
    retry: {
        maxRetries: 3, // retries after the initial attempt
        baseDelayMs: 250, // first backoff delay
        maxDelayMs: 5_000, // backoff cap
        retryOnStatus: [429, 500, 502, 503, 504],
        retryOnNetworkError: true,
        jitter: true, // randomize each wait within [0, computed delay]
    },
});
```

Backoff delays use full jitter by default: each wait is a random value between `0` and the computed exponential cap. Server-dictated `Retry-After` waits are never jittered; pass `jitter: false` for deterministic delays.

When a request exhausts its retries, the last error is thrown — catch it as shown in [Handling errors](#handling-errors).
