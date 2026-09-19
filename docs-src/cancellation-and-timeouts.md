---
title: Cancellation & timeouts
description: "Per-request timeout and AbortSignal support in AniLink, including the fail-fast check for invalid timeout values."
layout: .vitepress/theme/DocsLayout.vue
---

# Cancellation & timeouts

## Timeouts

`timeout` is the milliseconds before AniLink aborts a request. The default is `30000` (30 s). `0` disables the timeout. Negative or non-finite values throw a `TypeError` when AniLink resolves the options, so the call fails fast instead of failing later.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink("token", { timeout: 10_000 });
```

Timeout failures throw `AniLinkNetworkError` with code `TIMEOUT_ERROR`. The error carries the effective duration as `timeoutMs`, so you know which deadline expired.

<Mermaid
    :code="`flowchart TD\n    A([Request sent]) --> B{timeout elapsed?}\n    B -- yes --> T([Throw TIMEOUT_ERROR]):::err\n    B -- no --> C{AbortSignal aborted?}\n    C -- yes --> AB([Throw ABORTED_ERROR]):::err\n    C -- no --> D{Response received?}\n    D -- no --> B\n    D -- yes --> E([Return result]):::ok\n\n    F([In retry wait]) --> G{AbortSignal aborted?}\n    G -- yes --> AB\n    G -- no --> H[Continue waiting]\n    H --> F\n\n    classDef ok fill:#d5e8d4,stroke:#82b366,color:#2d5016;\n    classDef err fill:#f8cecc,stroke:#b85450,color:#5c1a1a;`"
/>

## Cancellation with `AbortSignal`

Pass an `AbortSignal` to cancel in-flight requests:

```typescript
const controller = new AbortController();

const aniLink = new AniLink("token", { signal: controller.signal });

setTimeout(() => controller.abort(), 2_000);

try {
    await aniLink.anilist.query.media({ id: 1, type: "ANIME" });
} catch (error) {
    // Aborted requests throw AniLinkNetworkError with code ABORTED_ERROR.
}
```

## Abort during retry waits

The retry loop checks for cancellation while a retry backoff is pending. Abort the signal during a wait and the retry loop stops immediately. The request rejects with `ABORTED_ERROR` instead of waiting out the delay.

## Abort during rate-limit pacing

With `paceWithRateLimit` enabled, AniLink records the window-reset deadline whenever a successful response reports remaining quota below `rateLimitFloor`. The _next_ request to that host waits for the deadline before dispatching. Abort the signal during that pre-dispatch wait and the request rejects with `ABORTED_ERROR`, but the error carries `abortedDuringPacing: true`. The request never reaches the network. The flag distinguishes a cancelled pacing wait from a cancelled in-flight request:

```typescript
try {
    await aniLink.anilist.query.page.medias({ page: 1, perPage: 50 });
} catch (error) {
    if (error instanceof AniLinkNetworkError && error.abortedDuringPacing) {
        // The request never reached the network; the pacing wait was cancelled.
    }
}
```

## Cancelling pagination look-ahead

The pagination helpers (`paginatePages`, `paginate`, `paginateChunks`) accept an optional `signal` in their options. Abort it to cancel every in-flight look-ahead page request immediately, so you spend no more rate-limit budget or bandwidth on responses you will not use:

```typescript
const controller = new AbortController();

for await (const page of aniLink.anilist.paginatePages(
    (page, perPage, signal) =>
        aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" }, { signal }),
    { signal: controller.signal }
)) {
    if (page.media[0]?.id === 1) {
        controller.abort(); // cancel in-flight look-ahead, then break
        break;
    }
}
```

Break out of a `paginatePages` loop early without passing a `signal` and the generator's `finally` block still aborts in-flight look-ahead requests, so they do not keep consuming rate-limit budget. See [Pagination](/guides/anilist/pagination) for the full options.

## Token-request defaults

OAuth token requests (both providers) use their own default timeout of 10 seconds, independent of instance transport settings. Pass `options.timeout` to the token-request helpers to override it.

## Provider scoping

`timeout` and `signal` are transport settings. They apply to the provider slot where you declare them. See [Provider configuration](/provider-configuration).

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) covers how retries interact with aborts.
- <Icon name="ArrowRight" :size="14" /> [Error handling](/error-handling) explains how to classify `TIMEOUT_ERROR` and `ABORTED_ERROR`.
