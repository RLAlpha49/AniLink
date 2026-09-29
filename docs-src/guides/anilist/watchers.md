---
title: Watchers
description: "The anilist.watch polling helpers: watch.notifications and watch.activity as async generators with dedupe, cursors, and abort support."
layout: .vitepress/theme/DocsLayout.vue
---

# Watchers

AniList has no push transport, so "notify me" workflows are polling workflows. The `anilist` namespace exposes two watchers as async generators: `aniLink.anilist.watch.notifications` polls your notification feed and `aniLink.anilist.watch.activity` polls the activity feed. Each watcher polls its `Page`-based feed operation, deduplicates by `id`, and yields each new item exactly once, oldest first within a poll.

<script setup>
import watcherPollCycle from "../../diagrams/watcher-poll-cycle.mmd?raw";
</script>

<Mermaid :code="watcherPollCycle" />

```typescript
const aniLink = new AniLink({ anilist: { authToken: "anilist-token" } });

for await (const notification of aniLink.anilist.watch.notifications({
    since: Math.floor(Date.now() / 1000) - 3600,
})) {
    console.log(notification.type, notification.createdAt);
}
```

`watch.notifications` reads the authenticated user's notification feed, so it needs a token. `watch.activity` can follow any user's public activity with `userId`, or your own feed with a token.

## `watch.notifications`

Polls `Page.notifications` every `intervalMs` and yields each new notification exactly once.

```typescript
const controller = new AbortController();

for await (const notification of aniLink.anilist.watch.notifications({
    since: Math.floor(Date.now() / 1000) - 3600,
    intervalMs: 60_000,
    signal: controller.signal,
})) {
    console.log(notification.type, notification.createdAt);
}
```

## `watch.activity`

Polls `Page.activities` (newest first, `ID_DESC` by default) and yields each new activity exactly once.

```typescript
for await (const activity of aniLink.anilist.watch.activity({
    userId: 542244,
    intervalMs: 120_000,
})) {
    console.log(activity.type, activity.createdAt);
}
```

## Options

Both watchers share these options. Each watcher adds its own feed filters.

| Option             | Default | Clamp     | Meaning                                                                                                                                                                                                                                                                                                                        |
| ------------------ | ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `since`            | none    | none      | Unix-second cursor. Only items with `createdAt` strictly greater than `since` are yielded, starting with the first poll. When omitted, the first poll establishes the baseline instead: it marks every item currently on the first page as seen and yields nothing, so the watcher reports only items created after it started |
| `intervalMs`       | `60000` | ≥ `10000` | Delay between polls. Values below 10000 are clamped up so the watcher cannot spend AniList's rate-limit budget on polling. Non-positive or non-finite values throw a `TypeError`                                                                                                                                               |
| `perPage`          | `50`    | ≤ `50`    | Items requested per poll page. AniList caps `perPage` at 50; larger values are clamped down. A burst larger than `perPage` items between two polls is still fully reported as long as each drained page contains at least one unseen item                                                                                      |
| `signal`           | none    | none      | `AbortSignal` that stops the watcher. An abort between polls ends the generator cleanly; an abort during an in-flight poll rejects it with the transport's `ABORTED` error. A `for await` loop's `break` or `return` also stops the watcher. Always pass one for long-running watchers                                         |
| `transportOptions` | none    | none      | Per-poll transport settings (`timeout`, retry policy, lifecycle hooks, pacing) merged over the instance-level options for every poll request. The watcher's `signal` is always forwarded to the transport regardless of this value                                                                                             |

`watch.notifications` adds these filters:

| Filter                   | Type     | Meaning                                                                                         |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------- |
| `type`                   | string   | Include only notifications of this type, forwarded as the page query's `type` variable          |
| `type_in`                | string[] | Include only notifications of these types, forwarded as the page query's `type_in` variable     |
| `resetNotificationCount` | boolean  | Resets the unread notification count to 0. One-shot: forwarded on the watcher's first poll only |
| `asHtml`                 | boolean  | Whether notification context strings render as HTML                                             |

`watch.activity` adds these filters:

| Filter        | Type     | Meaning                                                                                                                                                                                                                     |
| ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `userId`      | number   | Include only activities of this user                                                                                                                                                                                        |
| `messengerId` | number   | Include only message activities with this messenger                                                                                                                                                                         |
| `mediaId`     | number   | Include only activities about this media                                                                                                                                                                                    |
| `type`        | string   | Include only activities of this type                                                                                                                                                                                        |
| `isFollowing` | boolean  | Include only activities of the users the authenticated user follows                                                                                                                                                         |
| `sort`        | string[] | Sort order forwarded as the page query's `sort` variable. Defaults to `["ID_DESC"]` (newest first). The drain logic assumes the newest items are on the first page, so pass a different order only with that caveat in mind |

## Poll and dedupe behavior

Each poll drains up to 10 pages until it reaches the seen frontier: the first page containing an already-seen item, a short page, or `hasNextPage: false`. When more than 10 pages of unseen items arrive at once, the next poll resumes from the page after the cap instead of restarting at page 1, so the unseen remainder is still reported.

Within a poll, items are detected newest first and yielded oldest first. The seen-id set is pruned to roughly three polls of lookback, so a watcher running for months holds a bounded window of ids while a late-arriving or reordered item inside the window is still deduplicated instead of re-yielded.

Every poll request runs through the shared transport, so retries, rate-limit pacing, and the circuit breaker apply to each request. Poll requests always bypass the instance-level `responseCache`: each poll needs current data, so a cache enabled on the client never makes the watcher stale.

## Stopping a watcher

The `signal` option is the primary way to stop a watcher. An abort between polls ends the generator cleanly; the `for await` loop finishes. An abort during an in-flight poll rejects it with the transport's `ABORTED` error, matching the rest of the library. A `for await` loop's `break` or `return` also stops the watcher because it happens while the generator is suspended at a yield. A watcher abandoned in any other way keeps polling until its `signal` aborts.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Cancellation & timeouts](/cancellation-and-timeouts) covers `AbortSignal` handling across the library.
- <Icon name="ArrowRight" :size="14" /> [Page queries](/guides/anilist/page-queries) documents the `Page.notifications` and `Page.activities` operations the watchers poll.
- <Icon name="ArrowRight" :size="14" /> [Observability](/observability) covers the transport hooks each poll request fires.
