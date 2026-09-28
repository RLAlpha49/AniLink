---
title: Cancellation & timeouts
description: "Per-request timeout and AbortSignal support in AniLink, including the fail-fast check for invalid timeout values."
layout: .vitepress/theme/DocsLayout.vue
---

# Cancellation & timeouts

## Timeouts

`timeout` sets how many milliseconds AniLink waits before aborting a request. The default is `30000` (30 s). `0` disables the timeout. AniLink throws a `TypeError` while resolving options if the value is negative or non-finite, so the call fails immediately.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink("token", { timeout: 10_000 });
```

Timeout failures throw `AniLinkNetworkError` with code `TIMEOUT_ERROR`. The error's `timeoutMs` field records the effective timeout duration.

<script setup>
import cancellationAndTimeouts from "./diagrams/cancellation-and-timeouts.mmd?raw";
</script>

<Mermaid :code="cancellationAndTimeouts" />

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

The retry loop checks for cancellation during backoff. If you abort the signal during a wait, the loop stops and the request rejects with `ABORTED_ERROR` without waiting for the delay to end.

## Abort during rate-limit pacing

When `paceWithRateLimit` is enabled, AniLink records the window-reset deadline if a successful response reports remaining quota below `rateLimitFloor`. The next request to that host waits until the deadline before dispatch. If you abort the signal during this wait, the request rejects with `ABORTED_ERROR` and the error includes `abortedDuringPacing: true`. The request never reaches the network. This flag distinguishes cancellation during pacing from cancellation of an in-flight request:

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

The pagination helpers (`paginatePages`, `paginate`, `paginateChunks`) accept an optional `signal` in their options. Abort it to cancel every in-flight look-ahead page request immediately. This prevents requests for pages you will not use from consuming rate-limit budget or bandwidth:

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

If you break out of a `paginatePages` loop early without passing a `signal`, the generator's `finally` block still aborts in-flight look-ahead requests. Those requests stop consuming rate-limit budget. See [Pagination](/guides/anilist/pagination) for the full options.

## Token-request defaults

OAuth token requests for both providers use a 10-second default timeout. This timeout does not depend on instance transport settings. Pass `options.timeout` to a token-request helper to change it.

## Provider scoping

`timeout` and `signal` are transport settings. They apply to the provider slot where you declare them. See [Provider configuration](/provider-configuration).

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) covers how retries interact with aborts.
- <Icon name="ArrowRight" :size="14" /> [Error handling](/error-handling) explains how to classify `TIMEOUT_ERROR` and `ABORTED_ERROR`.
