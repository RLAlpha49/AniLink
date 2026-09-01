---
title: Recipes
layout: .vitepress/theme/DocsLayout.vue
---

# Recipes

Complete, copy-pasteable workflows. Each recipe states its provider scope.

## AniList: paginated list sync

**Provider: AniList.** Collect a user's anime list across all pages and upsert into a local store.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink(process.env.ANILIST_TOKEN);

const result = await aniLink.anilist.paginate(
    (page, perPage) =>
        aniLink.anilist.query.page.medias({
            page,
            perPage,
            type: "ANIME",
            sort: ["TRENDING_DESC"],
        }),
    "media",
    { perPage: 50, maxPages: 10, concurrency: 4 }
);

console.log(`synced ${result.items.length} items across ${result.pageCount} pages`);
if (result.truncated) console.warn("stopped at maxPages before the source ran out");
```

`paginate` keeps results in page order even with `concurrency > 1`. See [Pagination](/guides/anilist/pagination).

## MAL: anime lookup with selected fields

**Provider: MAL.** Fetch only the fields you need.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({ mal: { accessToken: process.env.MAL_TOKEN } });

const anime = await aniLink.mal.anime.get(21, {
    fields: ["id", "title", "main_picture", "synopsis", "mean"],
});

console.log(anime.title, anime.main_picture?.medium);
```

`id` and `title` are always present. Other fields appear when requested. See [MAL operations](/guides/mal/operations).

## Cross-provider title comparison

**Providers: both.** Compare how the two databases title the same show. AniLink does **not** normalize data across providers — you map between them yourself.

<Mermaid
    :code="`flowchart LR\n    A[AniLink instance\nboth providers configured]:::c\n    A -->|query.media id=21| AL[AniList\nmedia.title.romaji]:::al\n    A -->|mal.anime.get 21| MAL[MAL\nanime.title]:::mal\n    AL --> M[Your mapping logic\ncompare titles]:::out\n    MAL --> M\n\n    classDef c fill:#dae8fc,stroke:#6c8ebf,color:#1a3a5c;\n    classDef al fill:#d5e8d4,stroke:#82b366,color:#2d5016;\n    classDef mal fill:#e1d5e7,stroke:#9673a6,color:#3b3a45;\n    classDef out fill:#fff2cc,stroke:#d6b656,color:#5c4a00;`"
/>

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({
    anilist: { authToken: process.env.ANILIST_TOKEN },
    mal: { accessToken: process.env.MAL_TOKEN },
});

const [anilistMedia, malAnime] = await Promise.all([
    aniLink.anilist.query.media({ id: 21, type: "ANIME" }),
    aniLink.mal.anime.get(21, { fields: ["id", "title"] }),
]);

console.log("AniList:", anilistMedia.media?.title?.romaji);
console.log("MAL:", malAnime.title);
```

## Background token-refresh loop

**Provider: MAL.** Refresh before expiry. Keep the stored refresh token when MAL does not rotate it.

```typescript
import { getMalTokenExpiry, refreshMalAccessToken, type MalTokenResponse } from "anilink-api-wrapper";

let token: MalTokenResponse = /* stored from the initial exchange */ {} as MalTokenResponse;

async function ensureFreshToken(): Promise<MalTokenResponse> {
    if (Date.now() < getMalTokenExpiry(token).getTime() - 60_000) return token;
    const refreshed = await refreshMalAccessToken({
        clientId: process.env.MAL_CLIENT_ID!,
        refreshToken: token.refresh_token!,
    });
    token = { ...refreshed, refresh_token: refreshed.refresh_token ?? token.refresh_token };
    return token;
}
```

The AniList equivalent uses `getTokenExpiry` and `refreshAccessToken` with the same proactive pattern. See [MAL authentication](/guides/mal/authentication) and [AniList authentication](/guides/anilist/authentication).

## Resilient scheduler

**Providers: both.** Pace requests, fail fast during outages, and observe latency.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({
    anilist: {
        authToken: process.env.ANILIST_TOKEN,
        paceWithRateLimit: true,
        circuitBreaker: { threshold: 5, cooldownMs: 30_000 },
        onResponse: ({ durationMs }) => metrics.record("anilist", durationMs),
    },
    mal: {
        accessToken: process.env.MAL_TOKEN,
        retry: { maxRetries: 2 },
        onResponse: ({ durationMs }) => metrics.record("mal", durationMs),
    },
});
```

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Troubleshooting & FAQ](/troubleshooting) — when a recipe misbehaves.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) — the operations used above in full detail.
