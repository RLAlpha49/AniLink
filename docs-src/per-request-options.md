---
title: Per-request options
layout: .vitepress/theme/DocsLayout.vue
---

# Per-request options

Every operation accepts a trailing options argument that overrides the instance defaults for that single call.

## AniList operations

AniList operations take `options?: RequestOptions` as their last parameter:

```typescript
const media = await aniLink.anilist.query.media(
    { id: 1, type: "ANIME" },
    { timeout: 5_000, signal: controller.signal }
);
```

## MAL operations

MAL operations take `MalRequestOptions`, which extends `RequestOptions` with the MAL `fields` selector:

```typescript
const anime = await aniLink.mal.anime.get(21, {
    fields: ["id", "title", "main_picture"],
    timeout: 8_000,
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `fields` | `string \| readonly string[]` | provider default fields | Comma-separated MAL field selector, or the same selector as an array. Shapes the response. |
| `timeout` | `number` | instance value (30000) | Milliseconds before the request is aborted. `0` disables. |
| `signal` | `AbortSignal` | instance value | Signal used to cancel the in-flight request. |
| `retry` | `boolean \| Partial<RetryPolicy>` | instance policy | Retry policy for this call. `false` opts out. |
| `exposeRawAxiosError` | `boolean` | `false` | Attach the raw Axios error for debugging. |

## Merge behavior

Per-request options are merged **shallowly** over the instance defaults. A partial override replaces the whole nested value for that key. For example, passing `retry: { maxRetries: 1 }` replaces the entire retry policy for that call. The other policy knobs fall back to the built-in defaults, not to your instance-level policy.

## Provider scoping

Options never cross providers. A per-request `timeout` on an AniList call does not affect MAL calls, and `fields` exists only on MAL operations.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [AniList client configuration](/guides/anilist/configuration) — instance-level options.
- <Icon name="ArrowRight" :size="14" /> [MAL operations](/guides/mal/operations) — `fields` selection in depth.
