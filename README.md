# AniLink

A typed TypeScript wrapper for the [AniList GraphQL API](https://docs.anilist.co/). AniLink turns raw AniList GraphQL into a set of named methods. You can query a user, save a list entry, or toggle a favourite. You do not need to write query strings or hand-roll HTTP.

## Why It Exists

AniList exposes a GraphQL API that is flexible but verbose. Every request needs a query document, a variables object, and careful handling of the response shape. AniLink removes that ceremony. You call a method, pass a plain object, and get back typed data. AniLink also validates your variables before they leave your app. A wrong field type fails fast with a clear message instead of a confusing API error.

## What You Can Do With It

AniLink uses one instance with a single `anilist` surface:

- `anilist.query` fetches data. This includes users, media, characters, staff, studios, reviews, activities, threads, notifications, and more.

- `anilist.query.page` returns paginated versions of the same resources.

- `anilist.mutation` changes data. You can update your profile, save and delete list entries, and post activities and replies. You can also toggle likes and favourites and manage reviews, threads, and AniChart settings.

- `anilist.custom` sends any raw query or mutation when you need something the named methods do not cover.

```typescript
import AniLink from "anilink-api-wrapper";

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

- **Pagination built in.** Page queries accept `page` and `perPage` and return paged responses.

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
import AniLink from "anilink-api-wrapper";

// With a token (required for authenticated queries and mutations)
const aniLink = new AniLink("your-auth-token");

// Without a token (public queries only)
const aniLink = new AniLink();
```

Get a token by registering an application on the [AniList developer settings](https://anilist.co/settings/developer).

### Query

```typescript
const user = await aniLink.anilist.query.user({ id: 542244, asHtml: true });
const media = await aniLink.anilist.query.media({ id: 1, type: "ANIME" });
const viewer = await aniLink.anilist.query.viewer({ asHtml: true });
```

### Paginate

```typescript
const page = await aniLink.anilist.query.page.medias({
  page: 1,
  perPage: 10,
  type: "ANIME",
  sort: ["POPULARITY_DESC"],
});
```

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
import {
  AniLinkApiError,
  AniLinkAuthError,
  AniLinkNetworkError,
} from "anilink-api-wrapper";

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

## License

[MIT](https://github.com/RLAlpha49/AniLink/blob/master/LICENSE)
