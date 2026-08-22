# AniLink

[![npm version](https://img.shields.io/npm/v/anilink-api-wrapper.svg)](https://www.npmjs.com/package/anilink-api-wrapper)
[![npm downloads](https://img.shields.io/npm/dm/anilink-api-wrapper.svg)](https://www.npmjs.com/package/anilink-api-wrapper)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/RLAlpha49/AniLink/blob/master/LICENSE)
[![CI](https://github.com/RLAlpha49/AniLink/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/RLAlpha49/AniLink/actions/workflows/ci.yml)
[![CodeQL](https://github.com/RLAlpha49/AniLink/actions/workflows/codeql.yml/badge.svg?branch=master)](https://github.com/RLAlpha49/AniLink/actions/workflows/codeql.yml)
[![Documentation](https://img.shields.io/website?url=https%3A%2F%2Frlalpha49.github.io%2FAniLink%2F&label=docs)](https://rlalpha49.github.io/AniLink/)

A typed TypeScript wrapper for the [AniList GraphQL API](https://docs.anilist.co/). AniLink turns raw AniList GraphQL into a set of named methods. You can query a user, save a list entry, or toggle a favourite. You do not need to write query strings or hand-roll HTTP.

> 🧪 Try the [AniLink API Explorer](https://rlalpha49.github.io/AniLink/explorer/) — build and test AniLink calls live against AniList.

## Why It Exists

AniList exposes a GraphQL API that is flexible but verbose. Every request needs a query document, a variables object, and careful handling of the response shape. AniLink removes that ceremony. You call a method, pass a plain object, and get back typed data. AniLink also validates your variables before they leave your app. A wrong field type fails fast with a clear message instead of a confusing API error.

## What You Can Do With It

AniLink uses one instance with a single `anilist` surface:

- `anilist.query` fetches data. This includes users, media, characters, staff, studios, reviews, activities, threads, notifications, and more.

- `anilist.query.page` returns paginated versions of the same resources.

- `anilist.paginate`, `anilist.paginatePages`, and `anilist.paginateChunks` walk every page or chunk for you, so you do not hand-roll `hasNextPage` loops.

- `anilist.mutation` changes data. You can update your profile, save and delete list entries, and post activities and replies. You can also toggle likes and favourites and manage reviews, threads, and AniChart settings.

- `anilist.custom` sends any raw query or mutation when you need something the named methods do not cover.

```typescript
import { AniLink } from "anilink-api-wrapper";

// Remember that you can create multiple instances with different auth tokens
// or one instance without a token for public queries.
const aniLink = new AniLink();
const aniLinkAuth = new AniLink("your-auth-token");

// Fetch a user
const user = await aniLink.anilist.query.user({ id: 542244 });

// Save an anime to your list
await aniLinkAuth.anilist.mutation.saveMediaListEntry({
    mediaId: 1,
    status: "COMPLETED",
    score: 9,
});

// Send a raw query
const viewer = await aniLinkAuth.anilist.custom("query { Viewer { id } }");
```

## Key Features

- **Typed end to end.** Every method has a typed variables interface and a typed response. Your editor catches mistakes before runtime.

- **No GraphQL strings for common tasks.** The named query and mutation methods cover the everyday AniList operations.

- **Variable validation.** AniLink checks required fields and types before sending. It throws a descriptive error like `Invalid id: 542244. Expected type: number` when something is wrong.

- **Optional auth.** Construct with a token for authenticated calls, or without one for public queries. You can create multiple instances with different tokens.

- **Custom escape hatch.** `anilist.custom` accepts any query or mutation string with an optional variables object.

- **Pagination built in.** Page queries accept `page` and `perPage`, and the `paginate` / `paginatePages` / `paginateChunks` helpers walk every page or chunk with a max-page guard.

- **Clear error handling.** API errors, including rate limits, surface as thrown errors you can catch and retry.

## Who It Is For

AniLink is for developers building tools around AniList. This includes trackers, recommendation engines, Discord bots, dashboards, or anything that reads or writes AniList data. If you would rather call `query.media({ id: 1 })` than maintain GraphQL documents, this is for you.

## Getting Started

### Install

```bash
npm install anilink-api-wrapper
```

### Initialize

```typescript
import { AniLink } from "anilink-api-wrapper";

// With a token (required for authenticated queries and mutations)
const aniLinkAuth = new AniLink("your-auth-token");

// Without a token (public queries only)
const aniLink = new AniLink();
```

Get a token by registering an application on the [AniList developer settings](https://anilist.co/settings/developer).

### OAuth

AniLink ships helpers for the AniList OAuth2 authorization-code flow, so you can obtain and refresh the token you pass to the `AniLink` constructor instead of hand-rolling the HTTP calls.

First, register an application on the [AniList developer settings](https://anilist.co/settings/developer) to get a client ID and client secret, and pick a redirect URI.

Send the user to the authorization URL to approve your application:

```typescript
import { buildAuthorizationUrl } from "anilink-api-wrapper";

const authorizeUrl = buildAuthorizationUrl("your-client-id", "https://example.com/callback");
// Redirect the user to `authorizeUrl`. After approval, AniList sends them back
// to your redirect URI with a `?code=` query parameter.
```

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

When the access token expires, exchange the stored refresh token for a new one. Note that the refresh response may not include a new `refresh_token`, in which case you keep using the one you stored:

```typescript
import { refreshAccessToken } from "anilink-api-wrapper";

const { access_token, refresh_token: rotated } = await refreshAccessToken(
    "your-client-id",
    "your-client-secret",
    refresh_token
);

const nextRefreshToken = rotated ?? refresh_token;
const aniLink = new AniLink(access_token);
```

### Query

```typescript
const user = await aniLink.anilist.query.user({ id: 542244, asHtml: true });
const media = await aniLink.anilist.query.media({ id: 1, type: "ANIME" });
const viewer = await aniLink.anilist.query.viewer({ asHtml: true });
```

### Paginate

Page queries accept `page` and `perPage` and return a single page with `pageInfo`. Fetch one page when you know the range:

```typescript
const page = await aniLink.anilist.query.page.medias({
    page: 1,
    perPage: 10,
    type: "ANIME",
    sort: ["POPULARITY_DESC"],
});
```

To walk every page, use the helpers on `aniLink.anilist`. They track `page`/`perPage` and `hasNextPage` for you and stop at a `maxPages` guard, so a runaway loop cannot fetch forever.

`paginate` collects every item across all pages into one array:

```typescript
const result = await aniLink.anilist.paginate(
    (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" }),
    "media",
    { perPage: 50, maxPages: 10 }
);
console.log(result.items.length, result.pageCount, result.truncated);
```

`paginatePages` yields each raw page response in turn. Use it for streaming or early exit when you do not need every item in memory:

```typescript
for await (const page of aniLink.anilist.paginatePages((page, perPage) =>
    aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" })
)) {
    console.log(page.pageInfo.currentPage, page.media.length);
    if (page.media.length > 0 && page.media[0].id === 1) break;
}
```

`paginateChunks` walks `MediaListCollection` chunks, which AniList returns with `hasNextChunk` instead of `pageInfo`:

```typescript
const result = await aniLink.anilist.paginateChunks(
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
console.log(result.items.length, result.chunkCount, result.truncated);
```

Each helper returns `truncated: true` when it stopped at the guard before the source ran out of pages or chunks.

### Mutate

```typescript
await aniLink.anilist.mutation.saveMediaListEntry({
    mediaId: 1,
    status: "COMPLETED",
    score: 9,
});

await aniLink.anilist.mutation.toggleFavourite({ animeId: 1 });
```

### Handle errors

AniLink throws typed errors with stable `code` values. HTTP failures are
represented by `AniLinkApiError` and expose the HTTP `status`; network,
timeout, and cancellation failures use `AniLinkNetworkError`. Calling an
authenticated operation without a token throws `AniLinkAuthError`. Successful
AniList response data is returned normally as the typed result of each
query or mutation. For failed API requests, `AniLinkApiError.data` contains
the upstream AniList response body. AniLink does not expose the raw Axios
response object, request headers, bearer token, or request internals.

```typescript
import { AniLinkApiError, AniLinkAuthError, AniLinkNetworkError } from "anilink-api-wrapper";

try {
    const user = await aniLink.anilist.query.user({ id: 542244 });
    console.log(user);
} catch (error: unknown) {
    if (error instanceof AniLinkApiError) {
        console.error(error.code, error.status, error.data);

        if (error.status === 429) {
            console.error("AniList rate limit reached. Try again later.");
        }
    } else if (error instanceof AniLinkAuthError) {
        console.error(error.code, error.message);
    } else if (error instanceof AniLinkNetworkError) {
        console.error(error.code, error.message);
    } else {
        throw error;
    }
}
```

The available transport codes are `API_ERROR`, `NETWORK_ERROR`,
`TIMEOUT_ERROR`, `ABORTED_ERROR`, `AUTH_ERROR`, and `UNKNOWN_ERROR`.

For local debugging, you can opt into the original Axios error:

```typescript
const debugClient = new AniLink("your-auth-token", {
    exposeRawAxiosError: true,
});

try {
    await debugClient.anilist.query.user({ id: 542244 });
} catch (error: unknown) {
    if (error instanceof AniLinkApiError) {
        console.error(error.rawAxiosError);
    }
}
```

`exposeRawAxiosError` defaults to `false`. Use it for local debugging;
the raw Axios error can contain request configuration and bearer-token
headers.

### Retry with backoff

AniLink can retry transient failures for you. Retrying is **opt-in**: by
default requests are sent exactly once and every failure is thrown to
your code. Pass `retry: true` to use the default policy, or pass a
partial policy to tune it. When enabled, AniLink retries HTTP `429` and
`5xx` responses plus network and timeout errors, with exponential
backoff. The `Retry-After` header is honored for `429` responses
(capped at 30 seconds).

```typescript
// Opt in with the default policy
const aniLink = new AniLink("your-auth-token", { retry: true });

// Or tune the policy
const aniLink = new AniLink("your-auth-token", {
    retry: {
        maxRetries: 3, // retries after the initial attempt
        baseDelayMs: 250, // first backoff delay
        maxDelayMs: 5_000, // backoff cap
        retryOnStatus: [429, 500, 502, 503, 504],
        retryOnNetworkError: true,
    },
});
```

Retries are disabled by default so you stay in control of when requests
are retried. Set `retry: false` explicitly to make that intent clear.

### Error hook

The `onError` hook is invoked when a request ultimately fails after all
retries are exhausted (or immediately when retries are disabled). Use it
to implement your own fallback (for example a cache or an offline queue).

```typescript
import { AniLink, AniLinkApiError } from "anilink-api-wrapper";

const aniLink = new AniLink("your-auth-token", {
    onError: (error, context) => {
        console.error(`Request to ${context.url} failed on attempt ${context.attempt}`);
        if (error instanceof AniLinkApiError && error.status === 429) {
            // queue the request for later
        }
    },
});
```

Common status codes from the AniList API:

- `400` bad request
- `401` unauthorized
- `404` not found
- `429` too many requests (rate limit)
- `500` internal server error

## Documentation

Full method and parameter reference: [AniLink documentation](https://rlalpha49.github.io/AniLink/).

More usage examples: [ANILIST_API_EXAMPLES](https://github.com/RLAlpha49/AniLink/blob/master/Examples/ANILIST_API_EXAMPLES.md).

## Development

```bash
npm install               # install dependencies
npm run typecheck         # TypeScript type checking
npm test                  # run unit tests
npm run test:integration  # run integration tests
npm run lint              # lint source and tests
npm run build             # build to dist/
npm run docs:generate     # generate API docs to docs/
```

## Resources

- [Contributing guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md) and [GitHub Releases](https://github.com/RLAlpha49/AniLink/releases)

## License

[MIT](https://github.com/RLAlpha49/AniLink/blob/master/LICENSE)
