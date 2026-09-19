---
title: Recipes
description: "Copy-pasteable AniLink workflows for paginated list sync, upserts, and token refresh. Each recipe states its provider scope up front."
layout: .vitepress/theme/DocsLayout.vue
---

# Recipes

Each recipe is copy-pasteable and states its provider scope up front.

## AniList: paginated list sync

**Provider: AniList.** Fetch every page of a user's anime list and upsert it into a local store.

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

const anime = await aniLink.mal.anime.get(
    { id: 21 },
    { fields: ["id", "title", "main_picture", "synopsis", "mean"] }
);

console.log(anime.title, anime.main_picture?.medium);
```

`id` and `title` are always present; other fields appear when you request them. See [MAL operations](/guides/mal/operations).

## Cross-provider title comparison

**Providers: both.** Compare how the two providers title the same show. AniList media includes `idMal`, the MyAnimeList id of the same entry. The `crossLink` helper turns a batch of AniList results into id lookup maps, so the mapping is two map lookups instead of hand-rolled code. AniLink still does **not** normalize data across providers. Titles, scores, and statuses are each provider's own.

<Mermaid
    :code="`flowchart LR\n    A[AniLink instance\nboth providers configured]:::c\n    A -->|query.media id=21| AL[AniList\nmedia.idMal]:::al\n    AL -->|crossLink| MAP[anilistToMal\nlookup map]:::proc\n    MAP -->|malId| MAL[mal.anime.get\nmalId]:::mal\n    AL --> M[Your mapping logic\ncompare titles]:::out\n    MAL --> M\n\n    classDef c fill:#dae8fc,stroke:#6c8ebf,color:#1a3a5c;\n    classDef al fill:#d5e8d4,stroke:#82b366,color:#2d5016;\n    classDef mal fill:#e1d5e7,stroke:#9673a6,color:#3b3a45;\n    classDef proc fill:#fff2cc,stroke:#d6b656,color:#5c4a00;\n    classDef out fill:#f5f5f5,stroke:#666666,color:#333333;`"
/>

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({
    anilist: { authToken: process.env.ANILIST_TOKEN },
    mal: { accessToken: process.env.MAL_TOKEN },
});

const anilistMedia = await aniLink.anilist.query.media({ id: 21, type: "ANIME" });

// Build the id lookup maps from the AniList result.
const { anilistToMal } = aniLink.anilist.crossLink([anilistMedia]);

const malId = anilistToMal.get(21);
if (malId !== undefined) {
    const malAnime = await aniLink.mal.anime.get({ id: malId }, { fields: ["id", "title"] });
    console.log("AniList:", anilistMedia.title.romaji);
    console.log("MAL:", malAnime.title);
}
```

For a whole page of results, pass the `media` array as-is. `crossLink` is pure and makes no requests. It collects entries without a MAL id in `unmapped`:

```typescript
const page = await aniLink.anilist.query.page.medias({ page: 1, perPage: 50, type: "ANIME" });
const { anilistToMal, unmapped } = aniLink.anilist.crossLink(page.media);

const malIds = page.media
    .map((media) => anilistToMal.get(media.id))
    .filter((malId): malId is number => malId !== undefined);

console.log(`${malIds.length} mapped, ${unmapped.length} without a MAL id`);
```

## Background token-refresh loop

**Provider: MAL.** Refresh before expiry, not after the `401`. Keep the stored refresh token when MAL does not rotate it.

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

The AniList equivalent, `getTokenExpiry` and `refreshAccessToken`, works the same way. See [MAL authentication](/guides/mal/authentication) and [AniList authentication](/guides/anilist/authentication).

## Resilient scheduler

**Providers: both.** Pace requests, fail fast during outages, and record response times. This is the setup to run in production.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({
    anilist: {
        authToken: process.env.ANILIST_TOKEN,
        paceWithRateLimit: true,
        circuitBreaker: { threshold: 5, cooldownMs: 30_000 },
        onCircuitOpen: ({ host, failures }) => metrics.increment("circuit.open", { host, failures }),
        onCircuitClose: ({ host }) => metrics.increment("circuit.close", { host }),
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

- <Icon name="ArrowRight" :size="14" /> [Troubleshooting & FAQ](/troubleshooting) for when a recipe does not work as expected.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) documents the operations used above.
